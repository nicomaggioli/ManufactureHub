import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Check,
  X,
  GitCompareArrows,
  Sparkles,
  Loader2,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { quotesApi, aiApi, type Quote, type AIQuoteAnalysis } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusFilters = ['all', 'pending', 'accepted', 'rejected', 'expired'];

const statusVariant: Record<string, 'default' | 'success' | 'destructive' | 'secondary' | 'warning'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'destructive',
  expired: 'secondary',
};

export function Quotes() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
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
    mutationFn: aiApi.analyzeQuote,
    onSuccess: (data) => {
      setAnalysis(data);
      setAnalysisOpen(true);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to analyze quote.', variant: 'destructive' });
    },
  });

  const quotes = quotesQuery.data ?? [];

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const compareQuotes = quotes.filter((q) => compareIds.includes(q.id));

  const columns: ColumnDef<Quote>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      render: (row) => (
        <input
          type="checkbox"
          checked={compareIds.includes(row.id)}
          onChange={() => toggleCompare(row.id)}
          className="rounded border-input"
        />
      ),
    },
    { key: 'projectName', header: 'Project', sortable: true },
    { key: 'manufacturerName', header: 'Manufacturer', sortable: true },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      sortable: true,
      render: (row) => <span className="data-value font-semibold">{formatCurrency(row.unitPrice, row.currency)}</span>,
    },
    { key: 'moq', header: 'MOQ', sortable: true, render: (row) => <span className="data-value">{row.moq}</span> },
    {
      key: 'leadTimeDays',
      header: 'Lead Time',
      sortable: true,
      render: (row) => <span className="data-value">{row.leadTimeDays} days</span>,
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      sortable: true,
      render: (row) => <span className="data-value">{formatDate(row.validUntil)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={statusVariant[row.status] ?? 'outline'}>{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600"
                onClick={(e) => { e.stopPropagation(); acceptMutation.mutate(row.id); }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(row.id); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              setAnalysisQuoteId(row.id);
              analyzeMutation.mutate(row.id);
            }}
          >
            {analyzeMutation.isPending && analysisQuoteId === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and compare manufacturer quotes.</p>
        </div>
        {compareIds.length >= 2 && (
          <Button onClick={() => setCompareOpen(true)}>
            <GitCompareArrows className="mr-2 h-4 w-4" />
            Compare ({compareIds.length})
          </Button>
        )}
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {statusFilters.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusFilter} className="mt-5">
          {quotesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : quotesQuery.isError ? (
            <Card>
              <CardContent className="py-12 text-center text-destructive">
                Failed to load quotes.
              </CardContent>
            </Card>
          ) : (
            <Card className="animate-in">
              <CardContent className="pt-5">
                <DataTable
                  columns={columns}
                  data={quotes}
                  keyExtractor={(r) => r.id}
                  emptyMessage="No quotes found"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Compare dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">Compare Quotes</DialogTitle>
            <DialogDescription>Side-by-side comparison of selected quotes.</DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attribute</th>
                  {compareQuotes.map((q) => (
                    <th key={q.id} className="p-2.5 text-left font-semibold">{q.manufacturerName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</td>
                  {compareQuotes.map((q) => <td key={q.id} className="p-2.5">{q.projectName}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Price</td>
                  {compareQuotes.map((q) => (
                    <td key={q.id} className="p-2.5 font-semibold data-value">{formatCurrency(q.unitPrice, q.currency)}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">MOQ</td>
                  {compareQuotes.map((q) => <td key={q.id} className="p-2.5 data-value">{q.moq.toLocaleString()}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead Time</td>
                  {compareQuotes.map((q) => <td key={q.id} className="p-2.5 data-value">{q.leadTimeDays} days</td>)}
                </tr>
                <tr className="border-b">
                  <td className="p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valid Until</td>
                  {compareQuotes.map((q) => <td key={q.id} className="p-2.5 data-value">{formatDate(q.validUntil)}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</td>
                  {compareQuotes.map((q) => (
                    <td key={q.id} className="p-2.5">
                      <Badge variant={statusVariant[q.status] ?? 'outline'}>{q.status}</Badge>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</td>
                  {compareQuotes.map((q) => <td key={q.id} className="p-2.5 text-xs">{q.notes || '--'}</td>)}
                </tr>
              </tbody>
            </table>
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
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Competitiveness</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.competitiveness}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Market Comparison</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.marketComparison}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Negotiation Tips</h4>
                <ul className="space-y-1">
                  {analysis.negotiationTips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">-</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Recommendation</h4>
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
