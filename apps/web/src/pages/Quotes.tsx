import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Check,
  X,
  GitCompareArrows,
  Sparkles,
  Loader2,
  ArrowUpDown,
  Clock,
  Factory,
  CalendarDays,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { quotesApi, aiApi, type Quote, type AIQuoteAnalysis } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

const statusVariant: Record<string, 'default' | 'success' | 'destructive' | 'secondary' | 'warning'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'destructive',
  expired: 'secondary',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500',
  accepted: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  expired: 'bg-slate-400',
};

type SortKey = 'unitPrice' | 'leadTimeDays' | 'createdAt';

export function Quotes() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisQuoteId, setAnalysisQuoteId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIQuoteAnalysis | null>(null);

  const quotesQuery = useQuery({
    queryKey: ['quotes', statusFilter !== 'all' ? statusFilter : undefined],
    queryFn: () => quotesApi.list(statusFilter !== 'all' ? { status: statusFilter } : undefined),
  });

  const acceptMutation = useMutation({
    mutationFn: quotesApi.accept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Quote accepted' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: quotesApi.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Quote rejected' });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (quoteId: string) => {
      const quote = quotes.find((q: Quote) => q.id === quoteId);
      return aiApi.analyzeQuotes(quote ? [quote as unknown as Record<string, unknown>] : []);
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setAnalysisOpen(true);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to analyze quote.', variant: 'destructive' });
    },
  });

  const quotes: Quote[] = quotesQuery.data ?? [];

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
  };

  // Sort quotes
  const sortedQuotes = useMemo(() => {
    const sorted = [...quotes].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [quotes, sortBy, sortAsc]);

  // Group by project
  const groupedByProject = useMemo(() => {
    const groups: Record<string, Quote[]> = {};
    sortedQuotes.forEach((q) => {
      const key = q.projectName || q.projectId;
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    });
    return groups;
  }, [sortedQuotes]);

  const compareQuotes = quotes.filter((q: Quote) => compareIds.includes(q.id));
  const projectKeys = Object.keys(groupedByProject);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-overline font-semibold uppercase tracking-widest text-muted-foreground mb-1">Review</p>
          <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare and manage manufacturer quotes across projects.</p>
        </div>
        {compareIds.length >= 2 && (
          <Button onClick={() => setCompareOpen(true)} className="rounded-lg">
            <GitCompareArrows className="mr-2 h-4 w-4" />
            Compare ({compareIds.length})
          </Button>
        )}
      </div>

      {/* Filters + sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status pills */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                statusFilter === s.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {s.value !== 'all' && (
                <span className={cn('mr-2 h-2 w-2 rounded-full', statusColors[s.value] ?? 'bg-muted-foreground')} />
              )}
              {s.label}
            </button>
          ))}
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          {[
            { key: 'unitPrice' as SortKey, label: 'Price' },
            { key: 'leadTimeDays' as SortKey, label: 'Lead time' },
            { key: 'createdAt' as SortKey, label: 'Date' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                sortBy === opt.key
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
              {sortBy === opt.key && (
                <ArrowUpDown className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Compare hint */}
      {compareIds.length > 0 && compareIds.length < 2 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 animate-in">
          <p className="text-sm text-muted-foreground">
            Select <span className="font-medium">{2 - compareIds.length} more</span> quote(s) to compare side by side.
          </p>
        </div>
      )}

      {/* Quotes grid */}
      {quotesQuery.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-24" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : quotesQuery.isError ? (
        <Card>
          <CardContent className="py-16 text-center text-destructive">
            Failed to load quotes.
          </CardContent>
        </Card>
      ) : quotes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-20">
            <div className="rounded-2xl bg-muted/60 p-5 mb-5">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-base font-medium text-muted-foreground mb-1">No quotes found</p>
            <p className="text-sm text-muted-foreground/70">Request quotes from manufacturers to see them here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {projectKeys.map((projectName) => (
            <div key={projectName}>
              {/* Project group header */}
              {projectKeys.length > 1 && (
                <div className="mb-4">
                  <p className="text-overline font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Project</p>
                  <h3 className="text-base font-semibold">{projectName}</h3>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedByProject[projectName].map((quote, i) => (
                  <Card
                    key={quote.id}
                    className={cn(
                      'transition-shadow hover:shadow-md animate-in relative group',
                      compareIds.includes(quote.id) && 'ring-2 ring-primary/40'
                    )}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Compare checkbox */}
                    <button
                      onClick={() => toggleCompare(quote.id)}
                      className={cn(
                        'absolute top-3 right-3 h-5 w-5 rounded border flex items-center justify-center transition-colors z-10',
                        compareIds.includes(quote.id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border bg-background opacity-0 group-hover:opacity-100'
                      )}
                      title="Select to compare"
                    >
                      {compareIds.includes(quote.id) && <span className="text-[10px] font-bold">&#10003;</span>}
                    </button>

                    <CardContent className="p-5 space-y-4">
                      {/* Manufacturer name */}
                      <div className="flex items-start gap-3 pr-6">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{quote.manufacturerName}</p>
                          {projectKeys.length <= 1 && (
                            <p className="text-xs text-muted-foreground truncate">{quote.projectName}</p>
                          )}
                        </div>
                      </div>

                      {/* Unit price - prominent */}
                      <div className="text-center py-3 rounded-xl bg-muted/40">
                        <p className="text-overline font-medium uppercase tracking-wider text-muted-foreground mb-1">Unit Price</p>
                        <p className="text-2xl font-bold data-value tracking-tight">{formatCurrency(quote.unitPrice, quote.currency)}</p>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                            <Package className="h-3 w-3" />
                          </div>
                          <p className="text-overline text-muted-foreground">MOQ</p>
                          <p className="text-sm font-semibold data-value">{quote.moq.toLocaleString()}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                            <Clock className="h-3 w-3" />
                          </div>
                          <p className="text-overline text-muted-foreground">Lead time</p>
                          <p className="text-sm font-semibold data-value">{quote.leadTimeDays}d</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                            <CalendarDays className="h-3 w-3" />
                          </div>
                          <p className="text-overline text-muted-foreground">Valid</p>
                          <p className="text-sm font-semibold data-value">{formatDate(quote.validityDate, 'MMM d')}</p>
                        </div>
                      </div>

                      {/* Status + actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <Badge variant={statusVariant[quote.status] ?? 'outline'} className="text-overline">
                          {quote.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {quote.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => acceptMutation.mutate(quote.id)}
                                disabled={acceptMutation.isPending || rejectMutation.isPending}
                                title="Accept"
                              >
                                {acceptMutation.isPending && acceptMutation.variables === quote.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => rejectMutation.mutate(quote.id)}
                                disabled={acceptMutation.isPending || rejectMutation.isPending}
                                title="Reject"
                              >
                                {rejectMutation.isPending && rejectMutation.variables === quote.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setAnalysisQuoteId(quote.id);
                              analyzeMutation.mutate(quote.id);
                            }}
                            title="AI Analysis"
                          >
                            {analyzeMutation.isPending && analysisQuoteId === quote.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compare dialog - side by side cards */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">Compare Quotes</DialogTitle>
            <DialogDescription>Side-by-side comparison of selected quotes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareQuotes.length}, minmax(0, 1fr))` }}>
            {compareQuotes.map((q) => (
              <Card key={q.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-3 bg-muted/30">
                  <CardTitle className="text-sm font-semibold">{q.manufacturerName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{q.projectName}</p>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="text-center py-3 rounded-lg bg-muted/40">
                    <p className="text-overline text-muted-foreground uppercase tracking-wider mb-1">Unit Price</p>
                    <p className="text-xl font-bold data-value">{formatCurrency(q.unitPrice, q.currency)}</p>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">MOQ</span>
                      <span className="font-medium data-value">{q.moq.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lead Time</span>
                      <span className="font-medium data-value">{q.leadTimeDays} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valid Until</span>
                      <span className="font-medium data-value">{formatDate(q.validityDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={statusVariant[q.status] ?? 'outline'} className="text-overline">{q.status}</Badge>
                    </div>
                  </div>
                  {q.notes && (
                    <div className="pt-3 border-t">
                      <p className="text-overline text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-xs text-muted-foreground">{q.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Analysis dialog */}
      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Sparkles className="h-5 w-5 text-primary" /> AI Quote Analysis
            </DialogTitle>
          </DialogHeader>
          {analysis ? (
            <div className="space-y-5">
              <div>
                <p className="text-overline font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Competitiveness</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.competitiveness}</p>
              </div>
              <div>
                <p className="text-overline font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Market Comparison</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.marketComparison}</p>
              </div>
              <div>
                <p className="text-overline font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Negotiation Tips</p>
                <ul className="space-y-1.5">
                  {analysis.negotiationTips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5 font-bold">-</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="text-overline font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Recommendation</p>
                <p className="text-sm font-semibold text-primary">{analysis.recommendation}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
