import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  BadgeCheck,
  LayoutGrid,
  List,
  MapPin,
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
          className={cn('h-3.5 w-3.5', i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20')}
        />
      ))}
      <span className="ml-1.5 data-value text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

function ManufacturerCard({ manufacturer, index }: { manufacturer: Manufacturer; index: number }) {
  return (
    <Link to={`/manufacturers/${manufacturer.id}`}>
      <Card
        className="cursor-pointer transition-all hover:shadow-card-hover h-full animate-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold leading-tight">{manufacturer.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {manufacturer.country}
              </div>
            </div>
            {manufacturer.verified && (
              <BadgeCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {manufacturer.specialties.slice(0, 2).map((s) => (
              <Badge key={s} variant="secondary" className="text-[11px] px-2 py-0.5">
                {s}
              </Badge>
            ))}
            {manufacturer.specialties.length > 2 && (
              <span className="text-[11px] text-muted-foreground">+{manufacturer.specialties.length - 2}</span>
            )}
          </div>
          <StarRating rating={manufacturer.rating} />
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
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="p-5 pb-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-20 mt-1.5" />
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function Manufacturers() {
  const navigate = useNavigate();
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manufacturers</h1>
        <p className="text-sm text-muted-foreground mt-1">Search and discover manufacturers worldwide</p>
      </div>

      {/* Search + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, specialty, location..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            Filters
            {hasFilters && (
              <Badge className="ml-2 text-[11px]" variant="secondary">
                Active
              </Badge>
            )}
          </Button>
          <div className="flex border border-border rounded-lg overflow-hidden">
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
          <Card className="w-60 shrink-0 self-start">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</CardTitle>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                  Clear all
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Country</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {countries.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
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
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Certifications</h4>
                <div className="space-y-1.5">
                  {certificationOptions.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
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
                <h4 className="text-xs font-medium text-muted-foreground mb-2">MOQ Range</h4>
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
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
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

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Min Sustainability</h4>
                <Input
                  type="range"
                  min={0}
                  max={100}
                  value={sustainabilityMin}
                  onChange={(e) => setSustainabilityMin(Number(e.target.value))}
                  className="h-2 p-0 border-0"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
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
            <Card>
              <CardContent className="py-10 text-center text-destructive text-sm">
                Failed to load manufacturers.
              </CardContent>
            </Card>
          ) : manufacturers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                <div className="rounded-xl bg-muted p-4 mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium mb-1">No manufacturers found</p>
                <p className="text-xs text-muted-foreground mb-4">Try adjusting your search or filters</p>
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-3.5 w-3.5" /> Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : view === 'grid' ? (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                <span className="data-value font-medium">{manufacturers.length}</span> results
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {manufacturers.map((m, i) => (
                  <ManufacturerCard key={m.id} manufacturer={m} index={i} />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                <span className="data-value font-medium">{manufacturers.length}</span> results
              </p>
              <Card>
                <CardContent className="pt-4">
                  <DataTable
                    columns={tableColumns}
                    data={manufacturers}
                    keyExtractor={(r) => r.id}
                    onRowClick={(r) => {
                      navigate(`/manufacturers/${r.id}`);
                    }}
                  />
                </CardContent>
              </Card>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
