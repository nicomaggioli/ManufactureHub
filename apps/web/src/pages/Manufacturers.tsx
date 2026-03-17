import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  BadgeCheck,
  MapPin,
  Leaf,
  SlidersHorizontal,
  X,
  Factory,
  GitCompareArrows,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { manufacturersApi, type Manufacturer, type ManufacturerSearchParams } from '@/lib/api';
import { cn } from '@/lib/utils';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const countryFlags: Record<string, string> = {
  China: 'CN',
  India: 'IN',
  Vietnam: 'VN',
  Bangladesh: 'BD',
  Turkey: 'TR',
  Italy: 'IT',
  USA: 'US',
  Mexico: 'MX',
  Portugal: 'PT',
  Thailand: 'TH',
};

const countries = Object.keys(countryFlags);
const certificationOptions = ['ISO 9001', 'ISO 14001', 'GOTS', 'OEKO-TEX', 'Fair Trade', 'BSCI', 'WRAP'];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20')}
        />
      ))}
      <span className="ml-1.5 data-value text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

function ManufacturerCard({ manufacturer, index, selected, onToggleCompare }: {
  manufacturer: Manufacturer;
  index: number;
  selected: boolean;
  onToggleCompare: () => void;
}) {
  return (
    <Card
      className="bg-card border rounded-md transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-md h-full relative group"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Compare checkbox */}
      <button
        onClick={(e) => { e.preventDefault(); onToggleCompare(); }}
        className={cn(
          'absolute top-3 right-3 h-5 w-5 rounded border flex items-center justify-center transition-colors z-10',
          selected
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border bg-background opacity-0 group-hover:opacity-100'
        )}
        title="Select to compare"
      >
        {selected && <span className="text-[10px] font-bold">&#10003;</span>}
      </button>

      <Link to={`/manufacturers/${manufacturer.id}`}>
        <CardHeader className="p-3 pb-2">
          {/* Name + verified */}
          <div className="flex items-start gap-2 pr-6">
            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Factory className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-semibold font-display leading-tight truncate">
                  {manufacturer.name}
                </CardTitle>
                {manufacturer.verified && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-blue-500 text-white border-0 rounded-full">Verified</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                <span className="font-sans">{manufacturer.country}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 space-y-3">
          {/* Specialties */}
          <div className="flex flex-wrap gap-1.5">
            {manufacturer.specialties.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-overline px-2 py-0.5 font-normal">
                {s}
              </Badge>
            ))}
            {manufacturer.specialties.length > 3 && (
              <Badge variant="outline" className="text-overline px-2 py-0.5">
                +{manufacturer.specialties.length - 3}
              </Badge>
            )}
          </div>

          {/* Rating */}
          <StarRating rating={manufacturer.rating} />

          {/* Certifications */}
          {manufacturer.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {manufacturer.certifications.slice(0, 3).map((c) => (
                <Badge key={c} variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                  {c}
                </Badge>
              ))}
              {manufacturer.certifications.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                  +{manufacturer.certifications.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Sustainability - simple text */}
          {manufacturer.sustainabilityScore > 0 && (
            <div className="flex items-center gap-1.5">
              <Leaf className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-muted-foreground font-sans">Sustainability:</span>
              <span className="text-xs font-semibold data-value">{manufacturer.sustainabilityScore}%</span>
            </div>
          )}

          {/* MOQ */}
          {manufacturer.moq !== null && manufacturer.moq !== undefined && (
            <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-sans">MOQ:</span>
              <span className="text-xs font-semibold data-value">{manufacturer.moq.toLocaleString()} units</span>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

function ManufacturersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="p-3 pb-2">
            <div className="flex items-start gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function Manufacturers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [moqRange, setMoqRange] = useState<[number, number]>([0, 100000]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const params: ManufacturerSearchParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(selectedCountries.length > 0 && { country: selectedCountries[0] }),
    ...(selectedCerts.length > 0 && { certifications: selectedCerts.join(',') }),
    ...(verifiedOnly && { verified: true }),
    ...(moqRange[0] > 0 && { moqMin: moqRange[0] }),
    ...(moqRange[1] < 100000 && { moqMax: moqRange[1] }),
  };

  const query = useQuery({
    queryKey: ['manufacturers', params],
    queryFn: () => manufacturersApi.search(params),
  });

  const manufacturers = query.data?.data ?? [];

  const toggleCountry = (c: string) =>
    setSelectedCountries((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const toggleCert = (c: string) =>
    setSelectedCerts((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const toggleCompare = (id: string) =>
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );

  const clearFilters = () => {
    setSelectedCountries([]);
    setSelectedCerts([]);
    setVerifiedOnly(false);
    setMoqRange([0, 100000]);
  };

  const hasFilters = selectedCountries.length > 0 || selectedCerts.length > 0 || verifiedOnly;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[17px] font-bold tracking-tight font-display">Manufacturers</h1>
        <p className="text-sm text-muted-foreground font-sans mt-1">Browse and discover verified manufacturers worldwide.</p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-2xl">
        <label htmlFor="mfr-search" className="sr-only">Search manufacturers</label>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="mfr-search"
          placeholder="Search by name, specialty, location..."
          className="pl-10 h-10 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter chips */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filterOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
            className="rounded-full text-xs"
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Filters
            {hasFilters && (
              <Badge className="ml-1.5 text-[10px]" variant="secondary">Active</Badge>
            )}
          </Button>

          {/* Quick country chips */}
          {countries.slice(0, 6).map((c) => (
            <button
              key={c}
              onClick={() => toggleCountry(c)}
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
                selectedCountries.includes(c)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {c}
            </button>
          ))}

          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors gap-1',
              verifiedOnly
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            Verified
          </button>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
              <X className="mr-1 h-3 w-3" /> Clear all
            </Button>
          )}
        </div>

        {/* Compare bar */}
        {compareIds.length > 0 && (
          <Card className="flex items-center gap-3 px-4 py-3">
            <GitCompareArrows className="h-4 w-4 text-primary" />
            <span className="text-sm font-sans">
              <span className="font-medium data-value">{compareIds.length}</span> of 4 selected for comparison
            </span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareIds([])}
              className="text-xs"
            >
              Clear
            </Button>
            {compareIds.length >= 2 && (
              <Button size="sm" className="text-xs">
                <GitCompareArrows className="mr-1.5 h-3.5 w-3.5" />
                Compare Now
              </Button>
            )}
          </Card>
        )}
      </div>

      <div className="flex gap-6">
        {/* Filter panel */}
        {filterOpen && (
          <Card className="w-64 shrink-0 self-start">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">Filters</CardTitle>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                  Clear all
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-5">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary mb-2">Country</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {countries.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm font-sans cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(c)}
                        onChange={() => toggleCountry(c)}
                        className="rounded border-input h-3.5 w-3.5"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary mb-2">Certifications</h4>
                <div className="space-y-1.5">
                  {certificationOptions.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm font-sans cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCerts.includes(c)}
                        onChange={() => toggleCert(c)}
                        className="rounded border-input h-3.5 w-3.5"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary mb-2">MOQ Range</h4>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    className="h-8 text-xs"
                    value={moqRange[0] || ''}
                    onChange={(e) => setMoqRange([Number(e.target.value), moqRange[1]])}
                  />
                  <span className="text-xs text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    className="h-8 text-xs"
                    value={moqRange[1] === 100000 ? '' : moqRange[1]}
                    onChange={(e) => setMoqRange([moqRange[0], Number(e.target.value) || 100000])}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-sans cursor-pointer hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={() => setVerifiedOnly(!verifiedOnly)}
                    className="rounded border-input h-3.5 w-3.5"
                  />
                  Verified only
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {query.isLoading ? (
            <ManufacturersSkeleton />
          ) : query.isError ? (
            <Card>
              <CardContent className="py-12 text-center text-destructive text-sm">
                Failed to load manufacturers.
              </CardContent>
            </Card>
          ) : manufacturers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                <p className="text-sm font-semibold font-display mb-1">No manufacturers found</p>
                <p className="text-sm text-muted-foreground/70 mb-5 font-sans">Try adjusting your search or filters.</p>
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-full text-xs">
                    <X className="mr-2 h-3.5 w-3.5" /> Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4 font-sans">
                Showing <span className="data-value font-medium">{manufacturers.length}</span> manufacturers
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {manufacturers.map((m, i) => (
                  <ManufacturerCard
                    key={m.id}
                    manufacturer={m}
                    index={i}
                    selected={compareIds.includes(m.id)}
                    onToggleCompare={() => toggleCompare(m.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
