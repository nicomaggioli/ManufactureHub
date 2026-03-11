import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Star,
  BadgeCheck,
  LayoutGrid,
  List,
  MapPin,
  Leaf,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
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

const countries = ['China', 'India', 'Vietnam', 'Bangladesh', 'Turkey', 'Italy', 'USA', 'Mexico', 'Portugal', 'Thailand'];
const certificationOptions = ['ISO 9001', 'ISO 14001', 'GOTS', 'OEKO-TEX', 'Fair Trade', 'BSCI', 'WRAP'];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-3 w-3', i < rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/20')}
        />
      ))}
      <span className="ml-1.5 data-value text-[11px] text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

function ManufacturerCard({ manufacturer, index }: { manufacturer: Manufacturer; index: number }) {
  return (
    <Link to={`/manufacturers/${manufacturer.id}`}>
      <Card
        className="stat-card cursor-pointer transition-all hover:shadow-md hover:border-border/80 h-full animate-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-heading text-sm font-semibold leading-tight">
              {manufacturer.name}
            </CardTitle>
            {manufacturer.verified && (
              <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {manufacturer.country}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2.5">
          <div className="flex flex-wrap gap-1">
            {manufacturer.specialties.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 rounded-md">
                {s}
              </Badge>
            ))}
            {manufacturer.specialties.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md">
                +{manufacturer.specialties.length - 3}
              </Badge>
            )}
          </div>
          <StarRating rating={manufacturer.rating} />
          <div className="flex flex-wrap gap-1">
            {manufacturer.certifications.slice(0, 2).map((c) => (
              <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0 rounded-md">
                {c}
              </Badge>
            ))}
          </div>
          {manufacturer.sustainabilityScore > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Leaf className="h-3 w-3 text-green-500" />
              Sustainability: <span className="data-value">{manufacturer.sustainabilityScore}</span>/100
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ManufacturersSkeleton({ view }: { view: 'grid' | 'table' }) {
  if (view === 'table') {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="stat-card">
          <CardHeader className="p-4 pb-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-20 mt-1.5" />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function Manufacturers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [moqRange, setMoqRange] = useState<[number, number]>([0, 100000]);
  const [sustainabilityMin, setSustainabilityMin] = useState(0);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const params: ManufacturerSearchParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(selectedCountries.length > 0 && { country: selectedCountries[0] }),
    ...(selectedCerts.length > 0 && { certifications: selectedCerts.join(',') }),
    ...(verifiedOnly && { verified: true }),
    ...(moqRange[0] > 0 && { moqMin: moqRange[0] }),
    ...(moqRange[1] < 100000 && { moqMax: moqRange[1] }),
    ...(sustainabilityMin > 0 && { sustainabilityScoreMin: sustainabilityMin }),
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

  const clearFilters = () => {
    setSelectedCountries([]);
    setSelectedCerts([]);
    setVerifiedOnly(false);
    setMoqRange([0, 100000]);
    setSustainabilityMin(0);
  };

  const hasFilters = selectedCountries.length > 0 || selectedCerts.length > 0 || verifiedOnly || sustainabilityMin > 0;

  const tableColumns: ColumnDef<Manufacturer>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'country', header: 'Country', sortable: true },
    {
      key: 'specialties',
      header: 'Specialties',
      render: (row) => row.specialties.slice(0, 2).join(', '),
    },
    { key: 'rating', header: 'Rating', sortable: true, render: (row) => <StarRating rating={row.rating} /> },
    {
      key: 'verified',
      header: 'Verified',
      render: (row) =>
        row.verified ? <BadgeCheck className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">--</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Manufacturers</h1>
        <p className="text-sm text-muted-foreground">Search and discover manufacturers worldwide</p>
      </div>

      {/* Search + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search by name, specialty, location..."
            className="pl-10 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
            className="rounded-lg"
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            Filters
            {hasFilters && (
              <Badge className="ml-2 text-[10px]" variant="secondary">
                Active
              </Badge>
            )}
          </Button>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none h-8 w-8"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none h-8 w-8"
              onClick={() => setView('table')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter panel */}
        {filterOpen && (
          <Card className="stat-card w-60 shrink-0 self-start">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-xs font-semibold uppercase tracking-wider">Filters</CardTitle>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-[10px] text-muted-foreground hover:text-foreground">
                  Clear all
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {/* Country */}
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Country</h4>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {countries.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-xs cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(c)}
                        onChange={() => toggleCountry(c)}
                        className="rounded border-input h-3 w-3"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Certifications</h4>
                <div className="space-y-1">
                  {certificationOptions.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-xs cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCerts.includes(c)}
                        onChange={() => toggleCert(c)}
                        className="rounded border-input h-3 w-3"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              {/* MOQ Range */}
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">MOQ Range</h4>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    className="h-7 text-xs rounded-md"
                    value={moqRange[0] || ''}
                    onChange={(e) => setMoqRange([Number(e.target.value), moqRange[1]])}
                  />
                  <span className="text-[10px] text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    className="h-7 text-xs rounded-md"
                    value={moqRange[1] === 100000 ? '' : moqRange[1]}
                    onChange={(e) => setMoqRange([moqRange[0], Number(e.target.value) || 100000])}
                  />
                </div>
              </div>

              {/* Verified toggle */}
              <div>
                <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={() => setVerifiedOnly(!verifiedOnly)}
                    className="rounded border-input h-3 w-3"
                  />
                  Verified only
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                </label>
              </div>

              {/* Sustainability */}
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Min Sustainability
                </h4>
                <Input
                  type="range"
                  min={0}
                  max={100}
                  value={sustainabilityMin}
                  onChange={(e) => setSustainabilityMin(Number(e.target.value))}
                  className="h-1.5 p-0 border-0"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0</span>
                  <span className="data-value font-medium">{sustainabilityMin}</span>
                  <span>100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {query.isLoading ? (
            <ManufacturersSkeleton view={view} />
          ) : query.isError ? (
            <Card className="stat-card">
              <CardContent className="py-10 text-center text-destructive text-sm">
                Failed to load manufacturers. Please try again.
              </CardContent>
            </Card>
          ) : manufacturers.length === 0 ? (
            <Card className="stat-card border-dashed">
              <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                <div className="rounded-lg bg-muted/60 p-4 mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium mb-1">No manufacturers found</p>
                <p className="text-xs text-muted-foreground/70 mb-4">Try adjusting your search or filters</p>
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-lg">
                    <X className="mr-2 h-3.5 w-3.5" /> Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : view === 'grid' ? (
            <>
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                <span className="data-value">{manufacturers.length}</span> results
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {manufacturers.map((m, i) => (
                  <ManufacturerCard key={m.id} manufacturer={m} index={i} />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                <span className="data-value">{manufacturers.length}</span> results
              </p>
              <Card className="stat-card">
                <CardContent className="pt-4">
                  <DataTable
                    columns={tableColumns}
                    data={manufacturers}
                    keyExtractor={(r) => r.id}
                    onRowClick={(r) => {
                      window.location.href = `/manufacturers/${r.id}`;
                    }}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Map view placeholder */}
          <div className="mt-6">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Map View</h3>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 text-muted-foreground">
              <div className="text-center">
                <MapPin className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                <p className="text-xs">Manufacturer locations will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
