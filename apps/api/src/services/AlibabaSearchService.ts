/**
 * AlibabaSearchService - Live + Mock Implementation
 *
 * This service searches Alibaba.com for real supplier data by scraping
 * the public search page. No API keys required. Falls back to realistic
 * mock data when live requests fail (network errors, rate limits, etc.).
 *
 * Live mode is enabled by default. Disable with env var:
 *   ALIBABA_LIVE_SEARCH=false
 */

import { cache } from "../utils/cache";
import { logger } from "../config/logger";

const CACHE_TTL = 6 * 60 * 60; // 6 hours
const LIVE_MODE = process.env.ALIBABA_LIVE_SEARCH !== "false";
const REQUEST_TIMEOUT_MS = 10_000;
const RATE_LIMIT_INTERVAL_MS = 2_000; // min 2s between live requests

export interface AlibabaSupplierResult {
  id: string;
  name: string;
  country: string;
  city: string;
  specialties: string[];
  certifications: string[];
  moq: number;
  rating: number;
  responseRate: number;
  verified: boolean;
  yearEstablished: number;
  employeeCount: string;
  annualRevenue: string;
  sustainabilityScore: number;
  imageUrl: string;
  profileUrl: string;
}

export interface AlibabaSearchFilters {
  country?: string;
  minOrder?: number;
  maxOrder?: number;
  verified?: boolean;
  minRating?: number;
}

export class AlibabaSearchService {
  /** Timestamp of the last live HTTP request (for rate limiting). */
  private lastRequestTime = 0;

  /**
   * Search suppliers by query with optional filters.
   * Results are cached in Redis for 6 hours.
   *
   * When LIVE_MODE is enabled, tries a real Alibaba.com search first,
   * falling back to mock data on any failure.
   */
  async searchSuppliers(
    query: string,
    filters: AlibabaSearchFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ suppliers: AlibabaSupplierResult[]; total: number; page: number; pageSize: number }> {
    const cacheKey = `alibaba:search:${query}:${JSON.stringify(filters)}:${page}:${pageSize}`;

    return cache.getOrSet(cacheKey, CACHE_TTL, async () => {
      if (LIVE_MODE) {
        try {
          const result = await this.searchSuppliersLive(query, filters, page, pageSize);
          if (result.suppliers.length > 0) {
            logger.info("[AlibabaSearch] Returning LIVE results", {
              query,
              count: result.suppliers.length,
              page,
            });
            return result;
          }
          logger.info("[AlibabaSearch] Live returned 0 results, falling back to mock", { query });
        } catch (err) {
          logger.warn("[AlibabaSearch] Live search failed, falling back to mock", {
            query,
            error: (err as Error).message,
          });
        }
      } else {
        logger.info("[AlibabaSearch] LIVE_MODE disabled, using mock data", { query });
      }

      return this.searchSuppliersMock(query, filters, page, pageSize);
    });
  }

  /**
   * Get detailed supplier information by ID.
   * Cached in Redis for 6 hours.
   */
  async getSupplierDetails(
    id: string
  ): Promise<AlibabaSupplierResult | null> {
    const cacheKey = `alibaba:supplier:${id}`;

    return cache.getOrSet(cacheKey, CACHE_TTL, async () => {
      return this.getSupplierDetailsMock(id);
    });
  }

  // ─── Live Implementation ───

  /**
   * Scrape Alibaba.com's public search page and extract supplier data
   * from embedded JSON. Rate-limited to 1 request per 2 seconds.
   */
  private async searchSuppliersLive(
    query: string,
    filters: AlibabaSearchFilters,
    page: number,
    pageSize: number
  ): Promise<{ suppliers: AlibabaSupplierResult[]; total: number; page: number; pageSize: number }> {
    // ── Rate limiting ──
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_INTERVAL_MS) {
      const waitMs = RATE_LIMIT_INTERVAL_MS - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    this.lastRequestTime = Date.now();

    // ── Build URL ──
    const params = new URLSearchParams({
      SearchText: query,
      page: String(page),
    });
    if (filters.country) {
      params.set("origin", filters.country);
    }
    const url = `https://www.alibaba.com/trade/search?${params.toString()}`;

    logger.debug("[AlibabaSearch] Fetching live", { url });

    // ── Fetch with timeout ──
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let html: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      html = await response.text();
    } finally {
      clearTimeout(timer);
    }

    // ── Parse embedded JSON data ──
    const suppliers = this.parseAlibabaHtml(html, filters);

    // Apply pagination locally if the page returned more items than needed
    const start = 0; // Alibaba's page param already handles server-side paging
    const paged = suppliers.slice(start, pageSize);

    return {
      suppliers: paged,
      total: suppliers.length,
      page,
      pageSize,
    };
  }

  /**
   * Attempt multiple strategies to extract product/supplier data from Alibaba HTML.
   *
   * Strategy 1: Look for `window.__INITIAL_DATA__` or `__page_data__` JSON blobs.
   * Strategy 2: Look for `"offerList"` or `"normalList"` JSON arrays.
   * Strategy 3: Regex-based extraction from structured HTML.
   */
  private parseAlibabaHtml(
    html: string,
    filters: AlibabaSearchFilters
  ): AlibabaSupplierResult[] {
    const results: AlibabaSupplierResult[] = [];

    try {
      // Strategy 1: __INITIAL_DATA__ / __page_data__ / window.__data__
      const jsonPatterns = [
        /window\.__INITIAL_DATA__\s*=\s*({[\s\S]*?});\s*<\/script>/,
        /window\.__page_data__\s*=\s*({[\s\S]*?});\s*<\/script>/,
        /window\.__data__\s*=\s*({[\s\S]*?});\s*<\/script>/,
        /__INIT_DATA__\s*=\s*({[\s\S]*?});\s*<\/script>/,
      ];

      let parsed: any = null;
      for (const pattern of jsonPatterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          try {
            parsed = JSON.parse(match[1]);
            logger.debug("[AlibabaSearch] Parsed embedded JSON via pattern", {
              pattern: pattern.source.slice(0, 40),
            });
            break;
          } catch {
            // JSON parse failed for this pattern, try next
          }
        }
      }

      if (parsed) {
        const offers = this.extractOfferList(parsed);
        if (offers.length > 0) {
          for (const offer of offers) {
            const supplier = this.normalizeOffer(offer);
            if (supplier && this.matchesFilters(supplier, filters)) {
              results.push(supplier);
            }
          }
          if (results.length > 0) return results;
        }
      }

      // Strategy 2: Search for offerList / normalList JSON arrays in script tags
      const offerListPatterns = [
        /"offerList"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /"normalList"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /"itemList"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
        /"galleryOfferList"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
      ];

      for (const pattern of offerListPatterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          try {
            const items = JSON.parse(match[1]);
            if (Array.isArray(items) && items.length > 0) {
              for (const item of items) {
                const supplier = this.normalizeOffer(item);
                if (supplier && this.matchesFilters(supplier, filters)) {
                  results.push(supplier);
                }
              }
              if (results.length > 0) return results;
            }
          } catch {
            // parse failed, try next pattern
          }
        }
      }

      // Strategy 3: Regex-based HTML extraction as last resort
      const htmlResults = this.extractFromHtmlStructure(html, filters);
      if (htmlResults.length > 0) return htmlResults;
    } catch (err) {
      logger.warn("[AlibabaSearch] HTML parsing failed entirely", {
        error: (err as Error).message,
      });
    }

    return results;
  }

  /**
   * Recursively walk a parsed JSON object looking for an array of offers.
   */
  private extractOfferList(obj: any, depth = 0): any[] {
    if (depth > 8 || !obj || typeof obj !== "object") return [];

    // Direct keys that typically hold product lists
    const listKeys = [
      "offerList",
      "normalList",
      "itemList",
      "galleryOfferList",
      "offers",
      "products",
      "data",
    ];

    for (const key of listKeys) {
      if (Array.isArray(obj[key]) && obj[key].length > 0) {
        // "data" is too generic — only accept if items look like offers
        if (key === "data") {
          const first = obj[key][0];
          if (first && (first.title || first.subject || first.name || first.productUrl)) {
            return obj[key];
          }
        } else {
          return obj[key];
        }
      }
    }

    // Recurse into sub-objects
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        const found = this.extractOfferList(obj[key], depth + 1);
        if (found.length > 0) return found;
      }
    }

    return [];
  }

  /**
   * Normalize a single offer/product object from Alibaba's JSON into our interface.
   */
  private normalizeOffer(offer: any): AlibabaSupplierResult | null {
    try {
      if (!offer || typeof offer !== "object") return null;

      const title: string =
        offer.title || offer.subject || offer.name || offer.productName || "";
      if (!title) return null;

      const supplierName: string =
        offer.supplierName ||
        offer.company?.name ||
        offer.supplier?.companyName ||
        offer.companyName ||
        offer.seller?.companyName ||
        title;

      const id: string = String(
        offer.id ||
          offer.offerId ||
          offer.productId ||
          offer.supplierId ||
          `LIVE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      );

      const country: string =
        offer.country ||
        offer.supplier?.country ||
        offer.company?.country ||
        offer.originPlace ||
        "China";

      const city: string =
        offer.city ||
        offer.supplier?.city ||
        offer.company?.city ||
        offer.location ||
        "";

      // MOQ parsing
      let moq = 1;
      const moqRaw =
        offer.moq || offer.minOrder || offer.moqValue || offer.minOrderQuantity;
      if (moqRaw) {
        const moqNum = parseInt(String(moqRaw).replace(/[^\d]/g, ""), 10);
        if (!isNaN(moqNum) && moqNum > 0) moq = moqNum;
      }

      // Rating
      let rating = 4.5;
      const ratingRaw =
        offer.starRating || offer.rating || offer.supplierRating || offer.score;
      if (ratingRaw) {
        const rNum = parseFloat(String(ratingRaw));
        if (!isNaN(rNum) && rNum > 0 && rNum <= 5) rating = Math.round(rNum * 10) / 10;
      }

      // Verified / Gold Supplier
      const verified: boolean =
        offer.verified === true ||
        offer.isGoldSupplier === true ||
        offer.goldSupplier === true ||
        offer.supplier?.isGold === true ||
        offer.tradeAssurance === true ||
        false;

      // Image
      const imageUrl: string =
        offer.imageUrl ||
        offer.image?.imgUrl ||
        offer.imgUrl ||
        offer.productImage ||
        offer.images?.[0] ||
        "";

      // Profile URL
      let profileUrl: string =
        offer.productUrl ||
        offer.detailUrl ||
        offer.href ||
        offer.link ||
        "";
      if (profileUrl && !profileUrl.startsWith("http")) {
        profileUrl = `https:${profileUrl}`;
      }

      // Keywords / specialties
      const specialties: string[] = [];
      if (offer.keywords && Array.isArray(offer.keywords)) {
        specialties.push(...offer.keywords.slice(0, 5));
      } else if (typeof offer.keywords === "string") {
        specialties.push(...offer.keywords.split(",").map((k: string) => k.trim()).filter(Boolean).slice(0, 5));
      }
      if (specialties.length === 0 && title) {
        // Use title words as fallback specialties
        specialties.push(
          ...title
            .toLowerCase()
            .split(/[\s,/|]+/)
            .filter((w: string) => w.length > 3)
            .slice(0, 4)
        );
      }

      // Year established
      let yearEstablished = 2010;
      const yearRaw =
        offer.yearEstablished ||
        offer.supplier?.yearEstablished ||
        offer.company?.yearEstablished;
      if (yearRaw) {
        const y = parseInt(String(yearRaw), 10);
        if (y > 1900 && y <= new Date().getFullYear()) yearEstablished = y;
      }

      // Response rate
      let responseRate = 80;
      const rrRaw =
        offer.responseRate || offer.supplier?.responseRate;
      if (rrRaw) {
        const rr = parseFloat(String(rrRaw).replace(/[%]/g, ""));
        if (!isNaN(rr) && rr > 0 && rr <= 100) responseRate = Math.round(rr);
      }

      // Certifications
      const certifications: string[] = [];
      if (Array.isArray(offer.certifications)) {
        certifications.push(...offer.certifications.slice(0, 5));
      } else if (Array.isArray(offer.certificates)) {
        certifications.push(...offer.certificates.slice(0, 5));
      }

      return {
        id,
        name: supplierName,
        country,
        city,
        specialties,
        certifications,
        moq,
        rating,
        responseRate,
        verified,
        yearEstablished,
        employeeCount: offer.employeeCount || offer.company?.staffNumber || "Unknown",
        annualRevenue: offer.annualRevenue || offer.company?.annualRevenue || "Unknown",
        sustainabilityScore: 5.0, // not available from scraping
        imageUrl,
        profileUrl,
      };
    } catch (err) {
      logger.debug("[AlibabaSearch] Failed to normalize offer", {
        error: (err as Error).message,
      });
      return null;
    }
  }

  /**
   * Last-resort HTML structure extraction using regex patterns.
   * Looks for product card patterns in the rendered HTML.
   */
  private extractFromHtmlStructure(
    html: string,
    filters: AlibabaSearchFilters
  ): AlibabaSupplierResult[] {
    const results: AlibabaSupplierResult[] = [];

    try {
      // Match product card titles and links
      const cardPattern =
        /<a[^>]*href="(\/\/[^"]*?\.alibaba\.com[^"]*?)"[^>]*>[\s\S]*?<[^>]*class="[^"]*(?:title|subject|product-name)[^"]*"[^>]*>([\s\S]*?)<\//gi;

      let match;
      let idx = 0;
      while ((match = cardPattern.exec(html)) !== null && idx < 40) {
        const link = match[1];
        const titleRaw = match[2];
        const title = titleRaw.replace(/<[^>]+>/g, "").trim();
        if (!title) continue;

        const supplier: AlibabaSupplierResult = {
          id: `LIVE-HTML-${idx}`,
          name: title,
          country: "China",
          city: "",
          specialties: title
            .toLowerCase()
            .split(/[\s,/|]+/)
            .filter((w) => w.length > 3)
            .slice(0, 4),
          certifications: [],
          moq: 1,
          rating: 4.5,
          responseRate: 80,
          verified: false,
          yearEstablished: 2010,
          employeeCount: "Unknown",
          annualRevenue: "Unknown",
          sustainabilityScore: 5.0,
          imageUrl: "",
          profileUrl: link.startsWith("http") ? link : `https:${link}`,
        };

        if (this.matchesFilters(supplier, filters)) {
          results.push(supplier);
        }
        idx++;
      }

      // Simpler fallback: extract any structured data with titles
      if (results.length === 0) {
        const simpleTitlePattern =
          /class="[^"]*(?:organic-gallery-title|elements-title-normal)[^"]*"[^>]*>([^<]+)</gi;
        let sMatch;
        let sIdx = 0;
        while ((sMatch = simpleTitlePattern.exec(html)) !== null && sIdx < 40) {
          const title = sMatch[1].trim();
          if (!title || title.length < 5) continue;

          results.push({
            id: `LIVE-REGEX-${sIdx}`,
            name: title,
            country: "China",
            city: "",
            specialties: title
              .toLowerCase()
              .split(/[\s,/|]+/)
              .filter((w) => w.length > 3)
              .slice(0, 4),
            certifications: [],
            moq: 1,
            rating: 4.5,
            responseRate: 80,
            verified: false,
            yearEstablished: 2010,
            employeeCount: "Unknown",
            annualRevenue: "Unknown",
            sustainabilityScore: 5.0,
            imageUrl: "",
            profileUrl: "",
          });
          sIdx++;
        }
      }
    } catch (err) {
      logger.debug("[AlibabaSearch] HTML structure extraction failed", {
        error: (err as Error).message,
      });
    }

    return results;
  }

  /**
   * Check whether a supplier matches the user-provided filters.
   */
  private matchesFilters(
    supplier: AlibabaSupplierResult,
    filters: AlibabaSearchFilters
  ): boolean {
    if (filters.country && supplier.country !== filters.country) return false;
    if (filters.verified !== undefined && supplier.verified !== filters.verified) return false;
    if (filters.minOrder && supplier.moq > filters.minOrder) return false;
    if (filters.maxOrder && supplier.moq < filters.maxOrder) return false;
    if (filters.minRating && supplier.rating < filters.minRating) return false;
    return true;
  }

  // ─── Mock Implementation (fallback) ───

  private searchSuppliersMock(
    query: string,
    filters: AlibabaSearchFilters,
    page: number,
    pageSize: number
  ): { suppliers: AlibabaSupplierResult[]; total: number; page: number; pageSize: number } {
    let results = MOCK_SUPPLIERS.filter((s) => {
      const queryLower = query.toLowerCase();
      const matchesQuery =
        s.name.toLowerCase().includes(queryLower) ||
        s.specialties.some((sp) => sp.toLowerCase().includes(queryLower));

      if (!matchesQuery) return false;
      if (filters.country && s.country !== filters.country) return false;
      if (filters.verified !== undefined && s.verified !== filters.verified) return false;
      if (filters.minOrder && s.moq > filters.minOrder) return false;
      if (filters.maxOrder && s.moq < filters.maxOrder) return false;
      if (filters.minRating && s.rating < filters.minRating) return false;

      return true;
    });

    // If query is very generic, return all matching
    if (results.length === 0) {
      results = MOCK_SUPPLIERS.slice(0, pageSize);
    }

    const total = results.length;
    const start = (page - 1) * pageSize;
    const paged = results.slice(start, start + pageSize);

    return { suppliers: paged, total, page, pageSize };
  }

  private getSupplierDetailsMock(id: string): AlibabaSupplierResult | null {
    return MOCK_SUPPLIERS.find((s) => s.id === id) ?? null;
  }
}

// ─── 50+ Realistic Mock Suppliers ───

const MOCK_SUPPLIERS: AlibabaSupplierResult[] = [
  { id: "ALI-001", name: "Guangzhou Silk Road Textiles Co., Ltd", country: "China", city: "Guangzhou", specialties: ["silk", "satin", "chiffon", "evening wear"], certifications: ["ISO 9001", "OEKO-TEX"], moq: 300, rating: 4.8, responseRate: 95, verified: true, yearEstablished: 2005, employeeCount: "200-500", annualRevenue: "$10M-$50M", sustainabilityScore: 7.2, imageUrl: "https://placeholder.com/silk-road.jpg", profileUrl: "https://alibaba.com/supplier/ALI-001" },
  { id: "ALI-002", name: "Shanghai Dragon Apparel Manufacturing", country: "China", city: "Shanghai", specialties: ["denim", "casual wear", "streetwear", "outerwear"], certifications: ["ISO 9001", "BSCI", "GOTS"], moq: 500, rating: 4.6, responseRate: 88, verified: true, yearEstablished: 2008, employeeCount: "500-1000", annualRevenue: "$50M-$100M", sustainabilityScore: 8.1, imageUrl: "https://placeholder.com/dragon.jpg", profileUrl: "https://alibaba.com/supplier/ALI-002" },
  { id: "ALI-003", name: "Dhaka Premier Garments Ltd", country: "Bangladesh", city: "Dhaka", specialties: ["t-shirts", "polo shirts", "basic knitwear", "cotton apparel"], certifications: ["WRAP", "SEDEX"], moq: 1000, rating: 4.3, responseRate: 78, verified: true, yearEstablished: 2010, employeeCount: "1000-5000", annualRevenue: "$10M-$50M", sustainabilityScore: 5.8, imageUrl: "https://placeholder.com/dhaka.jpg", profileUrl: "https://alibaba.com/supplier/ALI-003" },
  { id: "ALI-004", name: "Istanbul Leather & Fashion House", country: "Turkey", city: "Istanbul", specialties: ["leather goods", "handbags", "belts", "leather jackets"], certifications: ["ISO 9001", "LWG"], moq: 100, rating: 4.7, responseRate: 92, verified: true, yearEstablished: 2003, employeeCount: "50-200", annualRevenue: "$5M-$10M", sustainabilityScore: 7.8, imageUrl: "https://placeholder.com/istanbul.jpg", profileUrl: "https://alibaba.com/supplier/ALI-004" },
  { id: "ALI-005", name: "Ho Chi Minh Stitch Works", country: "Vietnam", city: "Ho Chi Minh City", specialties: ["sportswear", "activewear", "yoga wear", "compression garments"], certifications: ["WRAP", "ISO 14001"], moq: 500, rating: 4.5, responseRate: 85, verified: true, yearEstablished: 2012, employeeCount: "500-1000", annualRevenue: "$10M-$50M", sustainabilityScore: 6.9, imageUrl: "https://placeholder.com/hcm.jpg", profileUrl: "https://alibaba.com/supplier/ALI-005" },
  { id: "ALI-006", name: "Prato Italian Knitwear S.r.l.", country: "Italy", city: "Prato", specialties: ["knitwear", "cashmere", "merino wool", "luxury basics"], certifications: ["ISO 9001", "OEKO-TEX", "RWS"], moq: 50, rating: 4.9, responseRate: 70, verified: true, yearEstablished: 1998, employeeCount: "50-200", annualRevenue: "$5M-$10M", sustainabilityScore: 9.1, imageUrl: "https://placeholder.com/prato.jpg", profileUrl: "https://alibaba.com/supplier/ALI-006" },
  { id: "ALI-007", name: "Mumbai Embroidery Arts Pvt Ltd", country: "India", city: "Mumbai", specialties: ["embroidery", "beadwork", "ethnic wear", "bridal wear"], certifications: ["SA8000", "SEDEX"], moq: 200, rating: 4.4, responseRate: 82, verified: true, yearEstablished: 2006, employeeCount: "200-500", annualRevenue: "$5M-$10M", sustainabilityScore: 6.5, imageUrl: "https://placeholder.com/mumbai.jpg", profileUrl: "https://alibaba.com/supplier/ALI-007" },
  { id: "ALI-008", name: "Shenzhen Smart Wearables Tech", country: "China", city: "Shenzhen", specialties: ["smart textiles", "heated clothing", "LED fashion", "tech wear"], certifications: ["ISO 9001", "CE", "FCC"], moq: 200, rating: 4.2, responseRate: 90, verified: true, yearEstablished: 2015, employeeCount: "100-500", annualRevenue: "$5M-$10M", sustainabilityScore: 5.5, imageUrl: "https://placeholder.com/shenzhen.jpg", profileUrl: "https://alibaba.com/supplier/ALI-008" },
  { id: "ALI-009", name: "Jakarta Batik Heritage Co.", country: "Indonesia", city: "Jakarta", specialties: ["batik", "sarong", "resort wear", "tropical prints"], certifications: ["WRAP"], moq: 300, rating: 4.3, responseRate: 75, verified: false, yearEstablished: 2009, employeeCount: "50-200", annualRevenue: "$1M-$5M", sustainabilityScore: 7.0, imageUrl: "https://placeholder.com/jakarta.jpg", profileUrl: "https://alibaba.com/supplier/ALI-009" },
  { id: "ALI-010", name: "Porto Premium Denim Factory", country: "Portugal", city: "Porto", specialties: ["premium denim", "selvedge", "organic cotton denim"], certifications: ["GOTS", "GRS", "OEKO-TEX"], moq: 150, rating: 4.8, responseRate: 80, verified: true, yearEstablished: 2001, employeeCount: "100-500", annualRevenue: "$10M-$50M", sustainabilityScore: 9.3, imageUrl: "https://placeholder.com/porto.jpg", profileUrl: "https://alibaba.com/supplier/ALI-010" },
  { id: "ALI-011", name: "Hangzhou Digital Print Masters", country: "China", city: "Hangzhou", specialties: ["digital printing", "sublimation", "all-over print", "custom fabric"], certifications: ["ISO 9001", "OEKO-TEX"], moq: 100, rating: 4.6, responseRate: 93, verified: true, yearEstablished: 2011, employeeCount: "100-500", annualRevenue: "$5M-$10M", sustainabilityScore: 6.8, imageUrl: "https://placeholder.com/hangzhou.jpg", profileUrl: "https://alibaba.com/supplier/ALI-011" },
  { id: "ALI-012", name: "Colombo Lingerie & Intimates Ltd", country: "Sri Lanka", city: "Colombo", specialties: ["lingerie", "intimate wear", "swimwear", "sleepwear"], certifications: ["WRAP", "BSCI", "OEKO-TEX"], moq: 500, rating: 4.5, responseRate: 86, verified: true, yearEstablished: 2007, employeeCount: "1000-5000", annualRevenue: "$10M-$50M", sustainabilityScore: 7.4, imageUrl: "https://placeholder.com/colombo.jpg", profileUrl: "https://alibaba.com/supplier/ALI-012" },
  { id: "ALI-013", name: "Marrakech Artisan Textiles", country: "Morocco", city: "Marrakech", specialties: ["handwoven", "caftans", "embroidered textiles", "artisan fashion"], certifications: ["Fair Trade"], moq: 50, rating: 4.7, responseRate: 65, verified: false, yearEstablished: 2014, employeeCount: "10-50", annualRevenue: "<$1M", sustainabilityScore: 8.5, imageUrl: "https://placeholder.com/marrakech.jpg", profileUrl: "https://alibaba.com/supplier/ALI-013" },
  { id: "ALI-014", name: "Seoul K-Fashion Hub", country: "South Korea", city: "Seoul", specialties: ["K-fashion", "trendy casual", "streetwear", "contemporary"], certifications: ["KCS", "OEKO-TEX"], moq: 100, rating: 4.6, responseRate: 88, verified: true, yearEstablished: 2013, employeeCount: "50-200", annualRevenue: "$5M-$10M", sustainabilityScore: 7.0, imageUrl: "https://placeholder.com/seoul.jpg", profileUrl: "https://alibaba.com/supplier/ALI-014" },
  { id: "ALI-015", name: "Lima Alpaca Luxury Textiles", country: "Peru", city: "Lima", specialties: ["alpaca wool", "luxury knitwear", "pima cotton", "sustainable fibers"], certifications: ["GOTS", "Fair Trade", "B Corp"], moq: 100, rating: 4.8, responseRate: 72, verified: true, yearEstablished: 2004, employeeCount: "50-200", annualRevenue: "$1M-$5M", sustainabilityScore: 9.5, imageUrl: "https://placeholder.com/lima.jpg", profileUrl: "https://alibaba.com/supplier/ALI-015" },
  { id: "ALI-016", name: "Tianjin Footwear Manufacturing Co.", country: "China", city: "Tianjin", specialties: ["sneakers", "casual shoes", "boots", "sandals"], certifications: ["ISO 9001", "BSCI"], moq: 600, rating: 4.3, responseRate: 87, verified: true, yearEstablished: 2006, employeeCount: "500-1000", annualRevenue: "$10M-$50M", sustainabilityScore: 5.9, imageUrl: "https://placeholder.com/tianjin.jpg", profileUrl: "https://alibaba.com/supplier/ALI-016" },
  { id: "ALI-017", name: "Chittagong Knit Composite Ltd", country: "Bangladesh", city: "Chittagong", specialties: ["fleece", "hoodies", "sweatshirts", "joggers"], certifications: ["WRAP", "OEKO-TEX", "BSCI"], moq: 800, rating: 4.4, responseRate: 80, verified: true, yearEstablished: 2011, employeeCount: "1000-5000", annualRevenue: "$10M-$50M", sustainabilityScore: 6.2, imageUrl: "https://placeholder.com/chittagong.jpg", profileUrl: "https://alibaba.com/supplier/ALI-017" },
  { id: "ALI-018", name: "Bangkok Swimwear Specialists", country: "Thailand", city: "Bangkok", specialties: ["swimwear", "beach cover-ups", "resort wear", "UV protection"], certifications: ["ISO 9001", "OEKO-TEX"], moq: 200, rating: 4.5, responseRate: 83, verified: true, yearEstablished: 2010, employeeCount: "100-500", annualRevenue: "$5M-$10M", sustainabilityScore: 7.1, imageUrl: "https://placeholder.com/bangkok.jpg", profileUrl: "https://alibaba.com/supplier/ALI-018" },
  { id: "ALI-019", name: "Suzhou Silk Excellence Co.", country: "China", city: "Suzhou", specialties: ["silk scarves", "silk dresses", "silk blouses", "luxury silk"], certifications: ["ISO 9001", "OEKO-TEX", "GOTS"], moq: 200, rating: 4.7, responseRate: 91, verified: true, yearEstablished: 2002, employeeCount: "200-500", annualRevenue: "$5M-$10M", sustainabilityScore: 7.6, imageUrl: "https://placeholder.com/suzhou.jpg", profileUrl: "https://alibaba.com/supplier/ALI-019" },
  { id: "ALI-020", name: "Medellin Activewear Solutions", country: "Colombia", city: "Medellin", specialties: ["activewear", "shapewear", "compression", "yoga pants"], certifications: ["WRAP", "BSCI"], moq: 300, rating: 4.6, responseRate: 79, verified: true, yearEstablished: 2013, employeeCount: "200-500", annualRevenue: "$5M-$10M", sustainabilityScore: 7.3, imageUrl: "https://placeholder.com/medellin.jpg", profileUrl: "https://alibaba.com/supplier/ALI-020" },
  { id: "ALI-021", name: "Dongguan Button & Trim Factory", country: "China", city: "Dongguan", specialties: ["buttons", "zippers", "trims", "labels", "packaging"], certifications: ["ISO 9001"], moq: 5000, rating: 4.4, responseRate: 94, verified: true, yearEstablished: 2007, employeeCount: "100-500", annualRevenue: "$5M-$10M", sustainabilityScore: 5.2, imageUrl: "https://placeholder.com/dongguan.jpg", profileUrl: "https://alibaba.com/supplier/ALI-021" },
  { id: "ALI-022", name: "Nairobi Sustainable Fashion Co.", country: "Kenya", city: "Nairobi", specialties: ["organic cotton", "ethical fashion", "African prints", "upcycled fashion"], certifications: ["Fair Trade", "GOTS", "B Corp"], moq: 100, rating: 4.5, responseRate: 68, verified: false, yearEstablished: 2016, employeeCount: "50-200", annualRevenue: "$1M-$5M", sustainabilityScore: 9.6, imageUrl: "https://placeholder.com/nairobi.jpg", profileUrl: "https://alibaba.com/supplier/ALI-022" },
  { id: "ALI-023", name: "Izmir Denim & Workwear Corp", country: "Turkey", city: "Izmir", specialties: ["workwear", "denim", "uniforms", "heavy duty apparel"], certifications: ["ISO 9001", "BSCI", "OEKO-TEX"], moq: 300, rating: 4.5, responseRate: 84, verified: true, yearEstablished: 2005, employeeCount: "500-1000", annualRevenue: "$10M-$50M", sustainabilityScore: 7.5, imageUrl: "https://placeholder.com/izmir.jpg", profileUrl: "https://alibaba.com/supplier/ALI-023" },
  { id: "ALI-024", name: "New Delhi Heritage Textiles", country: "India", city: "New Delhi", specialties: ["block print", "hand dyed", "organic cotton", "heritage techniques"], certifications: ["GOTS", "Fair Trade"], moq: 150, rating: 4.6, responseRate: 74, verified: true, yearEstablished: 2008, employeeCount: "100-500", annualRevenue: "$1M-$5M", sustainabilityScore: 8.8, imageUrl: "https://placeholder.com/delhi.jpg", profileUrl: "https://alibaba.com/supplier/ALI-024" },
  { id: "ALI-025", name: "Wenzhou Accessories World", country: "China", city: "Wenzhou", specialties: ["jewelry", "hair accessories", "fashion accessories", "sunglasses"], certifications: ["ISO 9001", "REACH"], moq: 500, rating: 4.2, responseRate: 91, verified: true, yearEstablished: 2009, employeeCount: "200-500", annualRevenue: "$5M-$10M", sustainabilityScore: 5.4, imageUrl: "https://placeholder.com/wenzhou.jpg", profileUrl: "https://alibaba.com/supplier/ALI-025" },
  { id: "ALI-026", name: "Phnom Penh Garment Works", country: "Cambodia", city: "Phnom Penh", specialties: ["woven shirts", "trousers", "uniforms", "workwear"], certifications: ["WRAP", "BSCI"], moq: 1000, rating: 4.1, responseRate: 76, verified: true, yearEstablished: 2012, employeeCount: "1000-5000", annualRevenue: "$10M-$50M", sustainabilityScore: 5.9, imageUrl: "https://placeholder.com/phnompenh.jpg", profileUrl: "https://alibaba.com/supplier/ALI-026" },
  { id: "ALI-027", name: "Barcelona Sustainable Knits", country: "Spain", city: "Barcelona", specialties: ["recycled polyester", "organic knitwear", "sustainable basics"], certifications: ["GOTS", "GRS", "OEKO-TEX", "B Corp"], moq: 100, rating: 4.8, responseRate: 77, verified: true, yearEstablished: 2015, employeeCount: "50-200", annualRevenue: "$1M-$5M", sustainabilityScore: 9.4, imageUrl: "https://placeholder.com/barcelona.jpg", profileUrl: "https://alibaba.com/supplier/ALI-027" },
  { id: "ALI-028", name: "Ningbo Outdoor Gear Manufacturing", country: "China", city: "Ningbo", specialties: ["outdoor jackets", "rain gear", "hiking apparel", "technical outerwear"], certifications: ["ISO 9001", "Bluesign", "OEKO-TEX"], moq: 300, rating: 4.5, responseRate: 89, verified: true, yearEstablished: 2004, employeeCount: "500-1000", annualRevenue: "$10M-$50M", sustainabilityScore: 7.2, imageUrl: "https://placeholder.com/ningbo.jpg", profileUrl: "https://alibaba.com/supplier/ALI-028" },
  { id: "ALI-029", name: "Addis Ababa Cotton Works", country: "Ethiopia", city: "Addis Ababa", specialties: ["cotton basics", "t-shirts", "underwear", "socks"], certifications: ["WRAP"], moq: 2000, rating: 4.0, responseRate: 65, verified: false, yearEstablished: 2014, employeeCount: "500-1000", annualRevenue: "$5M-$10M", sustainabilityScore: 6.1, imageUrl: "https://placeholder.com/addis.jpg", profileUrl: "https://alibaba.com/supplier/ALI-029" },
  { id: "ALI-030", name: "Bali Artisan Co-op", country: "Indonesia", city: "Bali", specialties: ["resort wear", "crochet", "macrame", "boho fashion"], certifications: ["Fair Trade"], moq: 50, rating: 4.7, responseRate: 60, verified: false, yearEstablished: 2017, employeeCount: "10-50", annualRevenue: "<$1M", sustainabilityScore: 8.9, imageUrl: "https://placeholder.com/bali.jpg", profileUrl: "https://alibaba.com/supplier/ALI-030" },
  { id: "ALI-031", name: "Tokyo Technical Fabrics Inc.", country: "Japan", city: "Tokyo", specialties: ["technical fabrics", "performance textiles", "Gore-Tex alternatives", "innovative materials"], certifications: ["ISO 9001", "JIS"], moq: 200, rating: 4.9, responseRate: 75, verified: true, yearEstablished: 1995, employeeCount: "200-500", annualRevenue: "$10M-$50M", sustainabilityScore: 8.3, imageUrl: "https://placeholder.com/tokyo.jpg", profileUrl: "https://alibaba.com/supplier/ALI-031" },
  { id: "ALI-032", name: "Tunis Embroidery Maison", country: "Tunisia", city: "Tunis", specialties: ["embroidery", "lace", "couture embellishments", "beading"], certifications: ["ISO 9001"], moq: 100, rating: 4.4, responseRate: 70, verified: false, yearEstablished: 2011, employeeCount: "50-200", annualRevenue: "$1M-$5M", sustainabilityScore: 7.0, imageUrl: "https://placeholder.com/tunis.jpg", profileUrl: "https://alibaba.com/supplier/ALI-032" },
  { id: "ALI-033", name: "Bucharest Outerwear Factory", country: "Romania", city: "Bucharest", specialties: ["coats", "winter jackets", "down jackets", "parkas"], certifications: ["ISO 9001", "OEKO-TEX"], moq: 200, rating: 4.5, responseRate: 82, verified: true, yearEstablished: 2006, employeeCount: "200-500", annualRevenue: "$5M-$10M", sustainabilityScore: 7.3, imageUrl: "https://placeholder.com/bucharest.jpg", profileUrl: "https://alibaba.com/supplier/ALI-033" },
  { id: "ALI-034", name: "Lahore Sports Apparel Co.", country: "Pakistan", city: "Lahore", specialties: ["sports uniforms", "jerseys", "sports socks", "athletic wear"], certifications: ["WRAP", "ISO 9001"], moq: 500, rating: 4.3, responseRate: 81, verified: true, yearEstablished: 2008, employeeCount: "500-1000", annualRevenue: "$5M-$10M", sustainabilityScore: 5.7, imageUrl: "https://placeholder.com/lahore.jpg", profileUrl: "https://alibaba.com/supplier/ALI-034" },
  { id: "ALI-035", name: "Fuzhou Bag & Luggage Group", country: "China", city: "Fuzhou", specialties: ["backpacks", "travel bags", "tote bags", "laptop bags"], certifications: ["ISO 9001", "BSCI", "SEDEX"], moq: 500, rating: 4.4, responseRate: 90, verified: true, yearEstablished: 2003, employeeCount: "500-1000", annualRevenue: "$10M-$50M", sustainabilityScore: 6.0, imageUrl: "https://placeholder.com/fuzhou.jpg", profileUrl: "https://alibaba.com/supplier/ALI-035" },
  { id: "ALI-036", name: "Cairo Cotton & Linen Mills", country: "Egypt", city: "Cairo", specialties: ["Egyptian cotton", "linen", "luxury bedding fabric", "shirting"], certifications: ["OEKO-TEX", "GOTS"], moq: 300, rating: 4.6, responseRate: 73, verified: true, yearEstablished: 2000, employeeCount: "200-500", annualRevenue: "$5M-$10M", sustainabilityScore: 7.8, imageUrl: "https://placeholder.com/cairo.jpg", profileUrl: "https://alibaba.com/supplier/ALI-036" },
  { id: "ALI-037", name: "Yangon Garment Solutions", country: "Myanmar", city: "Yangon", specialties: ["basic apparel", "cut and sew", "polo shirts", "workwear"], certifications: ["WRAP"], moq: 1000, rating: 3.9, responseRate: 70, verified: false, yearEstablished: 2015, employeeCount: "500-1000", annualRevenue: "$1M-$5M", sustainabilityScore: 4.8, imageUrl: "https://placeholder.com/yangon.jpg", profileUrl: "https://alibaba.com/supplier/ALI-037" },
  { id: "ALI-038", name: "Queretaro Premium Leather", country: "Mexico", city: "Queretaro", specialties: ["leather goods", "western boots", "leather jackets", "small leather goods"], certifications: ["ISO 9001", "LWG"], moq: 100, rating: 4.5, responseRate: 78, verified: true, yearEstablished: 2007, employeeCount: "100-500", annualRevenue: "$5M-$10M", sustainabilityScore: 7.1, imageUrl: "https://placeholder.com/queretaro.jpg", profileUrl: "https://alibaba.com/supplier/ALI-038" },
  { id: "ALI-039", name: "Taipei Performance Fabrics Corp", country: "Taiwan", city: "Taipei", specialties: ["moisture wicking", "anti-bacterial fabric", "UV protection", "performance knits"], certifications: ["Bluesign", "OEKO-TEX", "GRS"], moq: 1000, rating: 4.7, responseRate: 85, verified: true, yearEstablished: 1999, employeeCount: "200-500", annualRevenue: "$10M-$50M", sustainabilityScore: 8.5, imageUrl: "https://placeholder.com/taipei.jpg", profileUrl: "https://alibaba.com/supplier/ALI-039" },
  { id: "ALI-040", name: "Johannesburg Fashion House", country: "South Africa", city: "Johannesburg", specialties: ["African fashion", "dashiki", "shweshwe", "contemporary African"], certifications: ["Fair Trade"], moq: 100, rating: 4.3, responseRate: 67, verified: false, yearEstablished: 2016, employeeCount: "50-200", annualRevenue: "$1M-$5M", sustainabilityScore: 8.0, imageUrl: "https://placeholder.com/joburg.jpg", profileUrl: "https://alibaba.com/supplier/ALI-040" },
  { id: "ALI-041", name: "Jiaxing Children's Wear Factory", country: "China", city: "Jiaxing", specialties: ["children's wear", "baby clothes", "kids activewear", "school uniforms"], certifications: ["ISO 9001", "OEKO-TEX", "CPSIA"], moq: 500, rating: 4.5, responseRate: 92, verified: true, yearEstablished: 2008, employeeCount: "500-1000", annualRevenue: "$10M-$50M", sustainabilityScore: 6.7, imageUrl: "https://placeholder.com/jiaxing.jpg", profileUrl: "https://alibaba.com/supplier/ALI-041" },
  { id: "ALI-042", name: "Florence Luxury Leather Goods", country: "Italy", city: "Florence", specialties: ["luxury handbags", "wallets", "belts", "Italian leather"], certifications: ["ISO 9001", "LWG", "Made in Italy"], moq: 30, rating: 4.9, responseRate: 65, verified: true, yearEstablished: 1992, employeeCount: "50-200", annualRevenue: "$5M-$10M", sustainabilityScore: 8.7, imageUrl: "https://placeholder.com/florence.jpg", profileUrl: "https://alibaba.com/supplier/ALI-042" },
  { id: "ALI-043", name: "Tirupur Organic Cotton Mills", country: "India", city: "Tirupur", specialties: ["organic cotton", "fair trade cotton", "sustainable basics", "yoga wear"], certifications: ["GOTS", "Fair Trade", "OEKO-TEX", "SA8000"], moq: 500, rating: 4.6, responseRate: 79, verified: true, yearEstablished: 2005, employeeCount: "500-1000", annualRevenue: "$5M-$10M", sustainabilityScore: 9.2, imageUrl: "https://placeholder.com/tirupur.jpg", profileUrl: "https://alibaba.com/supplier/ALI-043" },
  { id: "ALI-044", name: "Hanoi Tailoring Excellence", country: "Vietnam", city: "Hanoi", specialties: ["suits", "tailored clothing", "formal wear", "bespoke"], certifications: ["ISO 9001", "WRAP"], moq: 200, rating: 4.6, responseRate: 83, verified: true, yearEstablished: 2010, employeeCount: "200-500", annualRevenue: "$5M-$10M", sustainabilityScore: 6.8, imageUrl: "https://placeholder.com/hanoi.jpg", profileUrl: "https://alibaba.com/supplier/ALI-044" },
  { id: "ALI-045", name: "Xiamen Hat & Cap Manufacturing", country: "China", city: "Xiamen", specialties: ["baseball caps", "beanies", "sun hats", "fashion hats"], certifications: ["ISO 9001", "BSCI"], moq: 300, rating: 4.3, responseRate: 88, verified: true, yearEstablished: 2010, employeeCount: "100-500", annualRevenue: "$5M-$10M", sustainabilityScore: 5.6, imageUrl: "https://placeholder.com/xiamen.jpg", profileUrl: "https://alibaba.com/supplier/ALI-045" },
  { id: "ALI-046", name: "Cebu Beachwear Collective", country: "Philippines", city: "Cebu", specialties: ["beachwear", "crochet bikinis", "resort accessories", "woven bags"], certifications: ["Fair Trade"], moq: 100, rating: 4.4, responseRate: 71, verified: false, yearEstablished: 2018, employeeCount: "10-50", annualRevenue: "<$1M", sustainabilityScore: 8.2, imageUrl: "https://placeholder.com/cebu.jpg", profileUrl: "https://alibaba.com/supplier/ALI-046" },
  { id: "ALI-047", name: "Gdansk Technical Outerwear", country: "Poland", city: "Gdansk", specialties: ["ski wear", "snowboard apparel", "technical outerwear", "waterproof garments"], certifications: ["ISO 9001", "Bluesign", "OEKO-TEX"], moq: 200, rating: 4.6, responseRate: 80, verified: true, yearEstablished: 2009, employeeCount: "200-500", annualRevenue: "$5M-$10M", sustainabilityScore: 7.9, imageUrl: "https://placeholder.com/gdansk.jpg", profileUrl: "https://alibaba.com/supplier/ALI-047" },
  { id: "ALI-048", name: "Quanzhou Shoe Components Ltd", country: "China", city: "Quanzhou", specialties: ["shoe soles", "insoles", "shoe components", "EVA foam"], certifications: ["ISO 9001", "REACH"], moq: 2000, rating: 4.2, responseRate: 93, verified: true, yearEstablished: 2006, employeeCount: "200-500", annualRevenue: "$10M-$50M", sustainabilityScore: 5.1, imageUrl: "https://placeholder.com/quanzhou.jpg", profileUrl: "https://alibaba.com/supplier/ALI-048" },
  { id: "ALI-049", name: "Casablanca Denim Wash House", country: "Morocco", city: "Casablanca", specialties: ["denim washing", "denim finishing", "distressed denim", "vintage wash"], certifications: ["ISO 14001", "ZDHC"], moq: 500, rating: 4.4, responseRate: 74, verified: true, yearEstablished: 2011, employeeCount: "100-500", annualRevenue: "$5M-$10M", sustainabilityScore: 6.5, imageUrl: "https://placeholder.com/casablanca.jpg", profileUrl: "https://alibaba.com/supplier/ALI-049" },
  { id: "ALI-050", name: "Helsinki Sustainable Outerwear", country: "Finland", city: "Helsinki", specialties: ["recycled outerwear", "vegan down", "circular fashion", "zero waste design"], certifications: ["GOTS", "GRS", "Bluesign", "B Corp", "Nordic Swan"], moq: 100, rating: 4.9, responseRate: 72, verified: true, yearEstablished: 2018, employeeCount: "10-50", annualRevenue: "$1M-$5M", sustainabilityScore: 9.8, imageUrl: "https://placeholder.com/helsinki.jpg", profileUrl: "https://alibaba.com/supplier/ALI-050" },
  { id: "ALI-051", name: "Chengdu Bamboo Fiber Innovations", country: "China", city: "Chengdu", specialties: ["bamboo fiber", "eco fabrics", "sustainable textiles", "hemp blends"], certifications: ["OEKO-TEX", "GOTS"], moq: 300, rating: 4.5, responseRate: 86, verified: true, yearEstablished: 2013, employeeCount: "100-500", annualRevenue: "$5M-$10M", sustainabilityScore: 8.6, imageUrl: "https://placeholder.com/chengdu.jpg", profileUrl: "https://alibaba.com/supplier/ALI-051" },
  { id: "ALI-052", name: "Guadalajara Denim Republic", country: "Mexico", city: "Guadalajara", specialties: ["denim", "jeans", "denim jackets", "western wear"], certifications: ["WRAP", "ISO 9001"], moq: 300, rating: 4.4, responseRate: 77, verified: true, yearEstablished: 2008, employeeCount: "200-500", annualRevenue: "$5M-$10M", sustainabilityScore: 6.8, imageUrl: "https://placeholder.com/guadalajara.jpg", profileUrl: "https://alibaba.com/supplier/ALI-052" },
  { id: "ALI-053", name: "Manchester Streetwear Printing", country: "United Kingdom", city: "Manchester", specialties: ["screen printing", "DTG printing", "streetwear", "graphic tees"], certifications: ["OEKO-TEX", "GOTS"], moq: 50, rating: 4.7, responseRate: 82, verified: true, yearEstablished: 2014, employeeCount: "10-50", annualRevenue: "$1M-$5M", sustainabilityScore: 7.7, imageUrl: "https://placeholder.com/manchester.jpg", profileUrl: "https://alibaba.com/supplier/ALI-053" },
];
