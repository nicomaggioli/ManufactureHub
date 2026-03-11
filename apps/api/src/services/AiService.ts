import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { logger } from "../config/logger";
import prisma from "../lib/prisma";
import { cache } from "../utils/cache";
import crypto from "crypto";

const MOCK_MODE = !config.anthropic.apiKey ||
  config.anthropic.apiKey.trim() === "" ||
  config.anthropic.apiKey === "sk-ant-placeholder" ||
  config.anthropic.apiKey === "your-api-key-here" ||
  config.anthropic.apiKey.startsWith("sk-ant-xxx");

const client = MOCK_MODE ? (null as unknown as Anthropic) : new Anthropic({ apiKey: config.anthropic.apiKey });

if (MOCK_MODE) {
  logger.warn("AiService running in MOCK mode - no valid ANTHROPIC_API_KEY found. Responses will be simulated.");
}

const AI_CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
const MODEL = "claude-sonnet-4-20250514";
const MOCK_MODEL = "mock-claude-sonnet";

interface AiCallResult<T> {
  result: T;
  tokensUsed: number;
  model: string;
  latencyMs: number;
}

// ─── Mock helpers ───

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, randomInt(200, 500)));
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ─── Mock response generators ───

function mockDraftMessage(
  type: string,
  projectContext: { title: string; description?: string; status?: string },
  manufacturerData: { name: string; country: string; specialties?: string[] },
  tone: string
): string {
  const greetings: Record<string, string> = {
    professional: "Dear",
    friendly: "Hi",
    formal: "Dear Sir/Madam at",
  };
  const greeting = greetings[tone] || "Dear";

  const templates: Record<string, string> = {
    initial_outreach: `${greeting} ${manufacturerData.name} Team,

I hope this message finds you well. My name is [Your Name], and I am reaching out regarding a new project we are developing: "${projectContext.title}".

${projectContext.description ? `Our project involves ${projectContext.description}, and we believe your expertise${manufacturerData.specialties?.length ? ` in ${manufacturerData.specialties.join(", ")}` : ""} would be an excellent fit.` : `We have been researching manufacturers${manufacturerData.country ? ` in ${manufacturerData.country}` : ""} and your company stood out due to your capabilities${manufacturerData.specialties?.length ? ` in ${manufacturerData.specialties.join(", ")}` : ""}.`}

We would love to explore a potential partnership. Could you share:
1. Your current production capacity and lead times?
2. Minimum order quantities for new clients?
3. Any relevant samples or portfolio work?

Looking forward to hearing from you.

Best regards,
[Your Name]`,

    follow_up: `${greeting} ${manufacturerData.name} Team,

I wanted to follow up on my previous message regarding our "${projectContext.title}" project.${projectContext.status ? ` The project is currently in the ${projectContext.status} phase, and we are eager to move forward.` : ""}

We remain very interested in working with your team${manufacturerData.specialties?.length ? `, particularly given your expertise in ${manufacturerData.specialties.join(", ")}` : ""}. If you could share your availability for a brief call this week, that would be wonderful.

Please let me know if you need any additional information from our side.

Kind regards,
[Your Name]`,

    negotiation: `${greeting} ${manufacturerData.name} Team,

Thank you for the quotation you provided for our "${projectContext.title}" project. We appreciate the detail and transparency.

After reviewing the numbers internally, we would like to discuss a few points:
1. Unit pricing - we believe there may be room for adjustment given our projected volumes.
2. Payment terms - we would prefer a 30/70 split (30% deposit, 70% on delivery).
3. Lead time - could we explore options to expedite by 1-2 weeks?

We value this partnership and are committed to finding terms that work for both parties.

Best regards,
[Your Name]`,

    thank_you: `${greeting} ${manufacturerData.name} Team,

I wanted to take a moment to express our sincere gratitude for your collaboration on the "${projectContext.title}" project.${manufacturerData.specialties?.length ? ` Your expertise in ${manufacturerData.specialties.join(" and ")} truly elevated the final product.` : ""}

We look forward to continuing our partnership on future collections.

With appreciation,
[Your Name]`,

    inquiry: `${greeting} ${manufacturerData.name} Team,

I am writing to inquire about your manufacturing capabilities for our upcoming project, "${projectContext.title}".

${projectContext.description ? `The project involves: ${projectContext.description}` : "We are in the early planning stages and evaluating potential manufacturing partners."}

Could you provide information on:
1. Your specialization areas and production capacity?
2. Quality control processes and certifications?
3. Typical lead times and MOQ requirements?
4. Sample development process and costs?

Thank you for your time. We look forward to your response.

Best regards,
[Your Name]`,
  };

  return templates[type] || templates["initial_outreach"];
}

function mockVetSupplier(
  manufacturerData: {
    name: string;
    country: string;
    specialties?: string[];
    certifications?: string[];
    moq?: number;
    rating?: number;
    responseRate?: number;
    sustainabilityScore?: number;
    verified?: boolean;
  }
): string {
  const reliabilityScore = randomInt(6, 9);
  const riskLevel = reliabilityScore >= 8 ? "Low" : reliabilityScore >= 7 ? "Medium" : "Medium-High";
  const recommendation = reliabilityScore >= 8 ? "Proceed" : reliabilityScore >= 7 ? "Proceed with Caution" : "Proceed with Caution";

  const allStrengths = [
    `Established manufacturing presence in ${manufacturerData.country}`,
    manufacturerData.specialties?.length ? `Specialized expertise in ${manufacturerData.specialties.join(", ")}` : "Diverse manufacturing capabilities",
    manufacturerData.certifications?.length ? `Holds relevant certifications: ${manufacturerData.certifications.join(", ")}` : "Open to pursuing additional certifications",
    manufacturerData.verified ? "Verified manufacturer with confirmed credentials" : "Listed on reputable sourcing platforms",
    manufacturerData.responseRate && manufacturerData.responseRate > 80 ? `Strong communication with ${manufacturerData.responseRate}% response rate` : "Responsive to initial inquiries",
    manufacturerData.rating && manufacturerData.rating >= 4 ? `High client satisfaction rating of ${manufacturerData.rating}/5` : "Growing reputation in the market",
    manufacturerData.sustainabilityScore && manufacturerData.sustainabilityScore > 6 ? "Demonstrates commitment to sustainable practices" : "Awareness of sustainability trends",
  ];

  const allRisks = [
    !manufacturerData.verified ? "Manufacturer is not yet independently verified" : "Verification may need periodic renewal",
    manufacturerData.moq ? `MOQ of ${manufacturerData.moq} units may be high for small test orders` : "MOQ requirements are not clearly stated",
    `Geographical risk factors associated with manufacturing in ${manufacturerData.country}`,
    "Limited historical order data available for analysis",
    !manufacturerData.certifications?.length ? "No certifications listed - compliance status unclear" : "Certification scope should be verified for your specific product category",
    manufacturerData.responseRate && manufacturerData.responseRate < 70 ? `Response rate of ${manufacturerData.responseRate}% is below industry average` : "Communication consistency should be monitored over time",
    "Intellectual property protection measures should be confirmed",
  ];

  const strengths = pickRandom(allStrengths, 3);
  const risks = pickRandom(allRisks, 3);

  const questions = [
    "Can you provide references from at least 3 current or recent clients in a similar product category?",
    "What quality control processes are in place, and do you conduct in-line inspections?",
    "What is your defect rate over the past 12 months, and how do you handle defective goods?",
    "Can you share your factory audit reports or allow a third-party inspection?",
    "What are your standard payment terms, and do you offer any flexibility for new partnerships?",
  ];

  const alternatives = [
    `Consider also evaluating manufacturers in ${manufacturerData.country === "China" ? "Vietnam or India" : manufacturerData.country === "India" ? "Bangladesh or Turkey" : "China or Vietnam"} for price comparison.`,
    "Request quotes from at least 2-3 additional suppliers to benchmark pricing and terms.",
  ];

  return `# Supplier Vetting Report: ${manufacturerData.name}

## Overall Risk Assessment: **${riskLevel}**
**Reliability Score: ${reliabilityScore}/10**

---

## Strengths
${strengths.map((s) => `- ${s}`).join("\n")}

## Potential Concerns
${risks.map((r) => `- ${r}`).join("\n")}

## Recommended Questions to Ask
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

## Verification Steps Suggested
1. Request and verify business registration documents
2. Conduct a virtual or in-person factory tour
3. Order product samples before committing to full production
4. Check references from existing clients
5. Verify certifications directly with issuing bodies

## Sustainability Assessment
${manufacturerData.sustainabilityScore && manufacturerData.sustainabilityScore > 6 ? `With a sustainability score of ${manufacturerData.sustainabilityScore}/10, this manufacturer shows above-average commitment to sustainable practices. Verify specific certifications (OEKO-TEX, GOTS, etc.) and request their environmental policy documentation.` : "Sustainability credentials are limited or unverified. If sustainability is a priority for your brand, request detailed information about their environmental practices, waste management, and material sourcing policies."}

## Alternative Suggestions
${alternatives.map((a) => `- ${a}`).join("\n")}

## Overall Recommendation: **${recommendation}**
${reliabilityScore >= 8 ? `${manufacturerData.name} appears to be a solid manufacturing partner. Proceed with standard due diligence steps outlined above.` : `${manufacturerData.name} shows potential but requires thorough vetting before committing to a production run. Complete all recommended verification steps before placing an order.`}`;
}

function mockAnalyzeDesign(
  assetUrls: string[],
  moodboardData: { notes?: string; itemCount?: number } | null,
  projectContext?: { title: string; description?: string }
): string {
  const projectName = projectContext?.title || "Untitled Project";

  return `# Design Analysis: ${projectName}

## 1. Design Direction Summary
${projectContext?.description ? `Based on the project description ("${projectContext.description}"), the design direction points toward a cohesive collection with strong visual identity.` : "The design assets suggest a focused creative vision with clear aesthetic intent."} ${assetUrls.length} asset(s) were reviewed${moodboardData?.itemCount ? ` alongside a moodboard with ${moodboardData.itemCount} reference items` : ""}.

## 2. Key Themes & Patterns
- **Minimalist sophistication** - Clean lines with purposeful detailing
- **Textural contrast** - Mixing smooth and tactile surfaces for visual interest
- **Modern heritage** - Contemporary silhouettes with nods to classic construction
${moodboardData?.notes ? `- **Moodboard direction** - ${moodboardData.notes}` : ""}

## 3. Color Palette Analysis
- Primary: Neutral earth tones (sand, taupe, warm grey)
- Accent: Muted jewel tones for contrast pieces
- Consideration: Ensure color consistency across different fabric types during production

## 4. Material Suggestions
- **Primary fabrics**: Medium-weight cotton twill, brushed modal blends
- **Accent fabrics**: Silk-satin for lining, organic cotton jersey for basics
- **Hardware**: Matte brass or antique silver for elevated yet understated detail
- **Sustainable alternatives**: Tencel/lyocell blends, recycled polyester for performance layers

## 5. Target Market Alignment
- Appeals to the 25-40 contemporary consumer segment
- Price positioning suggests mid-to-premium market placement
- Strong alignment with current direct-to-consumer brand aesthetics
- Consider capsule sizing for initial production to test market response

## 6. Manufacturing Considerations
- **Complexity level**: Moderate - standard construction with some specialty details
- **Recommended processes**: Cut-and-sew with some heat-transfer or screen printing
- **Quality checkpoints**: Seam consistency, color matching across lots, hardware attachment strength
- **Production challenges**: Color matching between different fabric types; hardware sourcing timeline

## 7. Trend Relevance
- Strong alignment with the "quiet luxury" movement
- Sustainable materials position well for conscious consumer appeal
- Versatile styling supports the growing "capsule wardrobe" trend
- Recommend incorporating at least one bold statement piece for marketing visibility`;
}

function mockExtractSpecData(description: string): string {
  // Parse what we can from the description
  const colorKeywords = ["black", "white", "red", "blue", "green", "navy", "beige", "cream", "grey", "gray", "pink", "brown", "tan", "ivory", "charcoal"];
  const materialKeywords = ["cotton", "polyester", "silk", "linen", "wool", "denim", "leather", "nylon", "satin", "velvet", "cashmere", "modal", "tencel", "rayon", "spandex", "lycra", "elastane"];
  const finishKeywords = ["matte", "glossy", "brushed", "polished", "distressed", "washed", "stonewashed", "garment-dyed", "enzyme-washed"];

  const lowerDesc = description.toLowerCase();
  const foundColors = colorKeywords.filter((c) => lowerDesc.includes(c));
  const foundMaterials = materialKeywords.filter((m) => lowerDesc.includes(m));
  const foundFinishes = finishKeywords.filter((f) => lowerDesc.includes(f));

  return JSON.stringify(
    {
      productType: "Apparel / Fashion Product",
      materials: foundMaterials.length ? foundMaterials : ["cotton"],
      colors: foundColors.length ? foundColors : ["black", "white"],
      sizes: ["XS", "S", "M", "L", "XL"],
      weight: null,
      dimensions: null,
      finishes: foundFinishes.length ? foundFinishes : ["standard"],
      closures: ["zipper"],
      specialFeatures: ["Custom label", "Reinforced stitching"],
      careInstructions: ["Machine wash cold", "Tumble dry low", "Do not bleach"],
      packaging: "Polybag with branded tissue paper",
      targetMoq: 100,
      estimatedUnitCost: "$12.00 - $18.00",
    },
    null,
    2
  );
}

function mockAnalyzeQuote(
  quotes: Array<{
    manufacturer: string;
    unitPrice: number;
    currency: string;
    moq?: number;
    leadTimeDays?: number;
    notes?: string;
  }>
): string {
  if (quotes.length === 0) {
    return "No quotes provided for analysis.";
  }

  const sorted = [...quotes].sort((a, b) => a.unitPrice - b.unitPrice);
  const cheapest = sorted[0];
  const avgPrice = quotes.reduce((sum, q) => sum + q.unitPrice, 0) / quotes.length;
  const fastest = [...quotes].filter((q) => q.leadTimeDays).sort((a, b) => (a.leadTimeDays || 999) - (b.leadTimeDays || 999))[0];

  const quoteRows = quotes
    .map(
      (q) =>
        `| ${q.manufacturer} | ${q.unitPrice} ${q.currency} | ${q.moq ?? "N/A"} | ${q.leadTimeDays ? `${q.leadTimeDays} days` : "N/A"} |`
    )
    .join("\n");

  const outliers = quotes.filter((q) => Math.abs(q.unitPrice - avgPrice) / avgPrice > 0.25);
  const outlierText =
    outliers.length > 0
      ? outliers
          .map(
            (q) =>
              `- **${q.manufacturer}** at ${q.unitPrice} ${q.currency} is ${q.unitPrice > avgPrice ? "significantly above" : "significantly below"} the average (${avgPrice.toFixed(2)} ${q.currency}). ${q.unitPrice < avgPrice ? "Verify quality standards are not compromised." : "Request a cost breakdown to understand premium drivers."}`
          )
          .join("\n")
      : "- No significant pricing outliers detected. All quotes are within a reasonable range.";

  return `# Quote Analysis Report

## Summary
| Manufacturer | Unit Price | MOQ | Lead Time |
|---|---|---|---|
${quoteRows}

**Average Unit Price**: ${avgPrice.toFixed(2)} ${quotes[0].currency}

## 1. Best Value Assessment
**${cheapest.manufacturer}** offers the lowest unit price at ${cheapest.unitPrice} ${cheapest.currency}${cheapest.moq ? ` with a MOQ of ${cheapest.moq} units` : ""}.${fastest ? ` **${fastest.manufacturer}** offers the fastest lead time at ${fastest.leadTimeDays} days.` : ""}

When factoring in MOQ requirements and lead time, ${cheapest.manufacturer} represents the best overall value for a first production run.

## 2. Pricing Outliers
${outlierText}

## 3. Lead Time Comparison
${quotes
    .filter((q) => q.leadTimeDays)
    .map((q) => `- ${q.manufacturer}: ${q.leadTimeDays} days`)
    .join("\n") || "Lead time data was not provided for all manufacturers."}

## 4. Risk Factors
${quotes.map((q) => `- **${q.manufacturer}**: ${q.unitPrice < avgPrice * 0.8 ? "Below-market pricing may indicate quality concerns. Request samples." : q.unitPrice > avgPrice * 1.2 ? "Premium pricing should include added value (quality, reliability, certifications)." : "Pricing is within expected range. Standard due diligence recommended."}${q.notes ? ` Note: ${q.notes}` : ""}`).join("\n")}

## 5. Negotiation Suggestions
1. Use the lowest quote as leverage when negotiating with other manufacturers
2. Ask about volume-based pricing tiers (e.g., discounts at 2x and 5x MOQ)
3. Negotiate payment terms: propose 30% deposit / 70% upon delivery
4. Request inclusion of shipping costs in the unit price for an apples-to-apples comparison
5. Ask about sample costs being credited toward the first production order

## 6. Final Recommendation
**Recommended: ${cheapest.manufacturer}** for initial production, with the following conditions:
- Verify quality through sample ordering before committing
- Negotiate payment terms to reduce upfront risk
- Establish clear quality control checkpoints
${quotes.length > 1 ? `\nMaintain **${sorted[1].manufacturer}** as a backup option for supply chain resilience.` : ""}`;
}

function mockGenerateFollowUp(
  conversationHistory: Array<{
    direction: "sent" | "received";
    body: string;
    sentAt?: string;
    subject?: string;
  }>
): string {
  const lastReceived = [...conversationHistory].reverse().find((m) => m.direction === "received");
  const lastSent = [...conversationHistory].reverse().find((m) => m.direction === "sent");

  if (!lastReceived && lastSent) {
    return `Hi,

I wanted to follow up on my previous message${lastSent.subject ? ` regarding "${lastSent.subject}"` : ""}. I understand you may be busy, but I would appreciate an update when you have a moment.

Is there any additional information I can provide to help move things forward?

Looking forward to hearing from you.

Best regards,
[Your Name]`;
  }

  if (lastReceived) {
    // Extract a snippet to reference
    const snippet = lastReceived.body.slice(0, 80).trim();
    return `Hi,

Thank you for your response${lastReceived.subject ? ` regarding "${lastReceived.subject}"` : ""}. I appreciate you sharing those details.

Following up on your message${snippet ? ` about "${snippet}..."` : ""} - I have a few additional points I would like to discuss:

1. Could we schedule a brief call to go over the specifics?
2. Are there any documents or samples you need from our side?
3. What would be a realistic timeline for next steps?

Please let me know your availability and I will work around your schedule.

Best regards,
[Your Name]`;
  }

  return `Hi,

I hope this message finds you well. I wanted to touch base and see if there are any updates on our ongoing discussion.

Please let me know if there is anything you need from my end.

Best regards,
[Your Name]`;
}

export class AiService {
  /**
   * Draft a communication message.
   */
  async draftMessage(
    type: "initial_outreach" | "follow_up" | "negotiation" | "thank_you" | "inquiry",
    projectContext: { title: string; description?: string; status?: string },
    manufacturerData: { name: string; country: string; specialties?: string[] },
    tone: "professional" | "friendly" | "formal" = "professional"
  ): Promise<AiCallResult<string>> {
    if (MOCK_MODE) {
      return this.callMock(
        () => mockDraftMessage(type, projectContext, manufacturerData, tone),
        "supplier_vetting",
        null
      );
    }

    const systemPrompt = `You are an expert sourcing assistant for independent fashion designers and small brands. You help draft professional communications with manufacturers.

Tone: ${tone}
Communication type: ${type}

Guidelines:
- Be concise but thorough
- Include relevant project details naturally
- Be culturally aware based on manufacturer's country
- Include specific questions when appropriate
- End with a clear call to action`;

    const userPrompt = `Draft a ${type.replace(/_/g, " ")} message for:

Project: ${projectContext.title}
${projectContext.description ? `Description: ${projectContext.description}` : ""}
${projectContext.status ? `Status: ${projectContext.status}` : ""}

Manufacturer: ${manufacturerData.name} (${manufacturerData.country})
${manufacturerData.specialties?.length ? `Specialties: ${manufacturerData.specialties.join(", ")}` : ""}`;

    return this.callClaude(
      systemPrompt,
      userPrompt,
      "supplier_vetting", // closest insight type for comms
      null
    );
  }

  /**
   * Vet a supplier and return a structured vetting report.
   */
  async vetSupplier(
    manufacturerData: {
      name: string;
      country: string;
      specialties?: string[];
      certifications?: string[];
      moq?: number;
      rating?: number;
      responseRate?: number;
      sustainabilityScore?: number;
      verified?: boolean;
    }
  ): Promise<AiCallResult<string>> {
    if (MOCK_MODE) {
      return this.callMock(
        () => mockVetSupplier(manufacturerData),
        "supplier_vetting",
        null
      );
    }

    const systemPrompt = `You are an expert supply chain analyst specializing in fashion and apparel manufacturing. Analyze the supplier data and produce a structured vetting report.

Your report MUST include:
1. Overall Risk Assessment (Low/Medium/High)
2. Strengths
3. Potential Concerns
4. Recommended Questions to Ask
5. Verification Steps Suggested
6. Sustainability Assessment
7. Overall Recommendation (Proceed/Proceed with Caution/Avoid)

Format as clean markdown.`;

    const userPrompt = `Vet this supplier:

Name: ${manufacturerData.name}
Country: ${manufacturerData.country}
Specialties: ${manufacturerData.specialties?.join(", ") || "Not specified"}
Certifications: ${manufacturerData.certifications?.join(", ") || "None listed"}
MOQ: ${manufacturerData.moq ?? "Not specified"}
Rating: ${manufacturerData.rating ?? "No rating"}
Response Rate: ${manufacturerData.responseRate ? `${manufacturerData.responseRate}%` : "Unknown"}
Sustainability Score: ${manufacturerData.sustainabilityScore ?? "Not rated"}
Verified: ${manufacturerData.verified ? "Yes" : "No"}`;

    return this.callClaude(systemPrompt, userPrompt, "supplier_vetting", null);
  }

  /**
   * Analyze design assets and moodboard for creative insights.
   */
  async analyzeDesign(
    assetUrls: string[],
    moodboardData: { notes?: string; itemCount?: number } | null,
    projectContext?: { title: string; description?: string }
  ): Promise<AiCallResult<string>> {
    if (MOCK_MODE) {
      return this.callMock(
        () => mockAnalyzeDesign(assetUrls, moodboardData, projectContext),
        "creative_analysis",
        null
      );
    }

    const systemPrompt = `You are a creative director and fashion design consultant. Analyze the design context provided and give actionable creative insights.

Your analysis should cover:
1. Design Direction Summary
2. Key Themes & Patterns
3. Color Palette Analysis
4. Material Suggestions
5. Target Market Alignment
6. Manufacturing Considerations
7. Trend Relevance

Be specific and actionable.`;

    const userPrompt = `Analyze this design context:

${projectContext ? `Project: ${projectContext.title}\n${projectContext.description ? `Description: ${projectContext.description}` : ""}` : ""}

Design Assets: ${assetUrls.length} file(s) provided
Asset URLs: ${assetUrls.join("\n")}

${moodboardData ? `Moodboard: ${moodboardData.itemCount ?? 0} items\nNotes: ${moodboardData.notes || "None"}` : "No moodboard data"}`;

    return this.callClaude(systemPrompt, userPrompt, "creative_analysis", null);
  }

  /**
   * Extract structured specification data from a freeform description.
   */
  async extractSpecData(
    description: string
  ): Promise<AiCallResult<string>> {
    if (MOCK_MODE) {
      return this.callMock(
        () => mockExtractSpecData(description),
        "spec_extraction",
        null
      );
    }

    const systemPrompt = `You are a technical fashion product specialist. Extract structured specification data from the provided description.

Return a JSON object with these fields (use null for unknown):
{
  "productType": string,
  "materials": string[],
  "colors": string[],
  "sizes": string[],
  "weight": string | null,
  "dimensions": { "length": string, "width": string, "height": string } | null,
  "finishes": string[],
  "closures": string[],
  "specialFeatures": string[],
  "careInstructions": string[],
  "packaging": string | null,
  "targetMoq": number | null,
  "estimatedUnitCost": string | null
}

Return ONLY valid JSON, no markdown or explanation.`;

    const userPrompt = `Extract spec data from this description:\n\n${description}`;

    return this.callClaude(systemPrompt, userPrompt, "spec_extraction", null);
  }

  /**
   * Analyze and compare quotes.
   */
  async analyzeQuote(
    quotes: Array<{
      manufacturer: string;
      unitPrice: number;
      currency: string;
      moq?: number;
      leadTimeDays?: number;
      notes?: string;
    }>
  ): Promise<AiCallResult<string>> {
    if (MOCK_MODE) {
      return this.callMock(
        () => mockAnalyzeQuote(quotes),
        "quote_analysis",
        null
      );
    }

    const systemPrompt = `You are a procurement analyst specializing in fashion manufacturing. Analyze the provided quotes and give a detailed comparison.

Your analysis should include:
1. Best Value Assessment (considering price, MOQ, lead time)
2. Price Analysis (per unit, total at different quantities)
3. Lead Time Comparison
4. Risk Factors per Quote
5. Negotiation Suggestions
6. Final Recommendation with reasoning

Format as clean markdown with tables where appropriate.`;

    const quotesText = quotes
      .map(
        (q, i) =>
          `Quote ${i + 1} - ${q.manufacturer}:
  Unit Price: ${q.unitPrice} ${q.currency}
  MOQ: ${q.moq ?? "Not specified"}
  Lead Time: ${q.leadTimeDays ? `${q.leadTimeDays} days` : "Not specified"}
  Notes: ${q.notes || "None"}`
      )
      .join("\n\n");

    const userPrompt = `Analyze these quotes:\n\n${quotesText}`;

    return this.callClaude(systemPrompt, userPrompt, "quote_analysis", null);
  }

  /**
   * Generate an automated follow-up draft based on conversation history.
   */
  async generateFollowUp(
    conversationHistory: Array<{
      direction: "sent" | "received";
      body: string;
      sentAt?: string;
      subject?: string;
    }>
  ): Promise<AiCallResult<string>> {
    if (MOCK_MODE) {
      return this.callMock(
        () => mockGenerateFollowUp(conversationHistory),
        "supplier_vetting",
        null
      );
    }

    const systemPrompt = `You are a sourcing assistant. Based on the conversation history, draft a natural follow-up message.

Guidelines:
- Reference specific points from the conversation
- Be polite but move the conversation forward
- Include any pending questions or action items
- Keep it concise`;

    const historyText = conversationHistory
      .map(
        (msg) =>
          `[${msg.direction.toUpperCase()}${msg.sentAt ? ` - ${msg.sentAt}` : ""}]${msg.subject ? ` Subject: ${msg.subject}` : ""}
${msg.body}`
      )
      .join("\n\n---\n\n");

    const userPrompt = `Draft a follow-up based on this conversation:\n\n${historyText}`;

    return this.callClaude(systemPrompt, userPrompt, "supplier_vetting", null);
  }

  // ─── Internal ───

  /**
   * Execute a mock AI call with simulated latency and token tracking.
   */
  private async callMock(
    generateResponse: () => string,
    insightType: "supplier_vetting" | "creative_analysis" | "market_intelligence" | "quote_analysis" | "spec_extraction",
    projectId: string | null
  ): Promise<AiCallResult<string>> {
    const cacheKey = `ai:mock:${insightType}:${crypto
      .createHash("sha256")
      .update(generateResponse.toString())
      .digest("hex")}`;

    return cache.getOrSet<AiCallResult<string>>(
      cacheKey,
      AI_CACHE_TTL,
      async () => {
        const start = Date.now();

        await mockDelay();

        const text = generateResponse();
        const latencyMs = Date.now() - start;
        const tokensUsed = estimateTokens(text) + randomInt(50, 150); // input + output estimate

        logger.info("AI mock call completed", {
          model: MOCK_MODEL,
          insightType,
          tokensUsed,
          latencyMs,
          projectId,
          mock: true,
        });

        // Save AiInsight record if we have a projectId
        if (projectId) {
          await prisma.aiInsight.create({
            data: {
              projectId,
              promptContext: "[MOCK] " + insightType,
              responseText: text,
              modelUsed: MOCK_MODEL,
              tokensUsed,
              insightType,
            },
          });
        }

        return { result: text, tokensUsed, model: MOCK_MODEL, latencyMs };
      }
    );
  }

  private async callClaude(
    systemPrompt: string,
    userPrompt: string,
    insightType: "supplier_vetting" | "creative_analysis" | "market_intelligence" | "quote_analysis" | "spec_extraction",
    projectId: string | null
  ): Promise<AiCallResult<string>> {
    // Build cache key from inputs
    const cacheKey = `ai:${insightType}:${crypto
      .createHash("sha256")
      .update(systemPrompt + userPrompt)
      .digest("hex")}`;

    // Try cache first (cache.getOrSet falls through to fetchFn on Redis failure)
    return cache.getOrSet<AiCallResult<string>>(
      cacheKey,
      AI_CACHE_TTL,
      async () => {
        const start = Date.now();

        const response = await client.messages.create({
          model: MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        const latencyMs = Date.now() - start;

        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n");

        const tokensUsed =
          (response.usage?.input_tokens ?? 0) +
          (response.usage?.output_tokens ?? 0);

        // Log the call
        logger.info("AI call completed", {
          model: MODEL,
          insightType,
          tokensUsed,
          latencyMs,
          projectId,
        });

        // Save AiInsight record if we have a projectId
        if (projectId) {
          await prisma.aiInsight.create({
            data: {
              projectId,
              promptContext: userPrompt.slice(0, 500),
              responseText: text,
              modelUsed: MODEL,
              tokensUsed,
              insightType,
            },
          });
        }

        return { result: text, tokensUsed, model: MODEL, latencyMs };
      }
    );
  }
}
