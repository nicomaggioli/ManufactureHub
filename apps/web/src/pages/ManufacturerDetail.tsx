import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Globe,
  Mail,
  Phone,
  MapPin,
  Star,
  Shield,
  Leaf,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { manufacturersApi, aiApi, communicationsApi, quotesApi, samplesApi } from '@/lib/api';
import type { Communication, Quote, Sample, AIVettingReport } from '@/lib/api';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-7 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48 md:col-span-2" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

export function ManufacturerDetail() {
  const { id } = useParams() as { id: string };

  const manufacturerQuery = useQuery({
    queryKey: ['manufacturers', id],
    queryFn: () => manufacturersApi.get(id),
    enabled: !!id,
  });

  const vettingQuery = useQuery({
    queryKey: ['ai', 'vet-manufacturer', id],
    queryFn: () => aiApi.vetManufacturer({ id }),
    enabled: !!id,
  });

  const commsQuery = useQuery({
    queryKey: ['communications', { manufacturerId: id }],
    queryFn: () => communicationsApi.list({ manufacturerId: id }),
    enabled: !!id,
  });

  const quotesQuery = useQuery({
    queryKey: ['quotes', { manufacturerId: id }],
    queryFn: () => quotesApi.list(),
    enabled: !!id,
  });

  const samplesQuery = useQuery({
    queryKey: ['samples', { manufacturerId: id }],
    queryFn: () => samplesApi.list(),
    enabled: !!id,
  });

  const manufacturer = manufacturerQuery.data;
  const vetting = vettingQuery.data as AIVettingReport | undefined;

  if (manufacturerQuery.isLoading) return <DetailSkeleton />;

  if (manufacturerQuery.isError || !manufacturer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/manufacturers">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Manufacturer not found or failed to load.
          </CardContent>
        </Card>
      </div>
    );
  }

  const commColumns: ColumnDef<Communication>[] = [
    { key: 'subject', header: 'Subject' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'delivered' ? 'success' : row.status === 'failed' ? 'destructive' : 'secondary'}>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    { key: 'sentAt', header: 'Sent At', render: (row) => <span className="data-value">{formatDate(row.sentAt ?? row.createdAt)}</span> },
  ];

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/manufacturers">
          <ArrowLeft className="mr-2 h-4 w-4" /> Manufacturers
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{manufacturer.name}</h1>
          {manufacturer.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/communications">
              <Mail className="mr-2 h-4 w-4" /> Contact
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Company Info */}
        <Card className="lg:col-span-2 animate-in relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{manufacturer.city ? `${manufacturer.city}, ` : ''}{manufacturer.country}</span>
              </div>
              {manufacturer.contacts?.[0]?.email && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${manufacturer.contacts[0].email}`} className="text-primary hover:underline truncate">
                    {manufacturer.contacts[0].email}
                  </a>
                </div>
              )}
              {manufacturer.contacts?.[0]?.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="data-value">{manufacturer.contacts[0].phone}</span>
                </div>
              )}
            </div>

            {/* Specialties */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Specialties</h4>
              <div className="flex flex-wrap gap-1.5">
                {manufacturer.specialties.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>

            {/* Rating + sustainability */}
            <div className="flex items-center gap-6 pt-1">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3.5 w-3.5',
                      i < manufacturer.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
                    )}
                  />
                ))}
                <span className="ml-1.5 text-sm font-semibold data-value">{manufacturer.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Leaf className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Sustainability</span>
                <span className="data-value font-semibold">{manufacturer.sustainabilityScore}/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="animate-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {manufacturer.certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No certifications listed</p>
            ) : (
              <div className="space-y-2">
                {manufacturer.certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-2.5 rounded-md border p-2.5">
                    <Shield className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{cert}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Vetting Report */}
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Vetting Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vettingQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : vettingQuery.isError ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Unable to generate vetting report at this time.
            </p>
          ) : vetting ? (
            <div className="space-y-5">
              {/* Overall score */}
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold data-value">{vetting.overallScore}<span className="text-base text-muted-foreground font-normal">/100</span></div>
                <Progress value={vetting.overallScore} className="flex-1 h-2.5" />
              </div>

              {/* Categories */}
              <div className="grid gap-3 sm:grid-cols-2">
                {vetting.categories.map((cat) => (
                  <div key={cat.name} className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-muted-foreground">{cat.name}</span>
                      <span className="text-sm font-bold data-value">{cat.score}/100</span>
                    </div>
                    <Progress value={cat.score} className="h-1.5 mb-2" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{cat.notes}</p>
                  </div>
                ))}
              </div>

              {/* Risks */}
              {vetting.risks.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Risks
                  </h4>
                  <ul className="space-y-1">
                    {vetting.risks.map((risk, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-warning mt-1">-</span> {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {vetting.recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                    <ThumbsUp className="h-3.5 w-3.5 text-primary" /> Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {vetting.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">-</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Communication History */}
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Communication History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={commColumns}
            data={commsQuery.data ?? []}
            keyExtractor={(r) => r.id}
            emptyMessage="No communication history with this manufacturer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
