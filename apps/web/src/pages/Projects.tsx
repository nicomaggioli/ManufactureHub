import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  Factory,
  Clock,
  Search,
  MessageSquare,
  FileText,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { projectsApi, type Project } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'ideation', label: 'Ideation' },
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'sampling', label: 'Sampling' },
  { value: 'production', label: 'Production' },
  { value: 'shipped', label: 'Shipped' },
];

const statusDotColors: Record<string, string> = {
  ideation: 'bg-slate-400',
  sourcing: 'bg-blue-500',
  sampling: 'bg-amber-500',
  production: 'bg-violet-500',
  shipped: 'bg-emerald-500',
};

const pipelineStages = ['ideation', 'sourcing', 'sampling', 'production', 'shipped'];

function PipelineIndicator({ status }: { status: string }) {
  const currentIdx = pipelineStages.indexOf(status);
  return (
    <div className="flex items-center gap-1 w-full">
      {pipelineStages.map((stage, idx) => (
        <div
          key={stage}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            idx <= currentIdx ? (statusDotColors[status] ?? 'bg-muted-foreground/20') : 'bg-muted-foreground/10'
          )}
          title={stage.charAt(0).toUpperCase() + stage.slice(1)}
        />
      ))}
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <Link to={`/projects/${project.id}`}>
      <Card
        className="cursor-pointer bg-card border rounded-md p-0 transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-md h-full"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-sm font-semibold font-display leading-tight">
              {project.title}
            </CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn('h-2 w-2 rounded-full', statusDotColors[project.status] ?? 'bg-muted-foreground')} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{project.status}</span>
            </div>
          </div>
          {project.description && (
            <CardDescription className="line-clamp-2 text-sm font-sans mt-1.5 leading-relaxed">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Pipeline progress */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">Pipeline</p>
            <PipelineIndicator status={project.status} />
          </div>

          {/* Key counts */}
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5" title="Quotes">
              <FileText className="h-3.5 w-3.5" />
              <span className="data-value font-medium">{project._count?.quotes ?? 0}</span>
            </span>
            <span className="flex items-center gap-1.5" title="Samples">
              <Package className="h-3.5 w-3.5" />
              <span className="data-value font-medium">{project._count?.samples ?? 0}</span>
            </span>
            <span className="flex items-center gap-1.5" title="Messages">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="data-value font-medium">{project._count?.communications ?? 0}</span>
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatRelativeDate(project.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="p-3 pb-2">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function Projects() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '' });

  const projectsQuery = useQuery({
    queryKey: ['projects', statusFilter !== 'all' ? statusFilter : undefined],
    queryFn: () => projectsApi.list(statusFilter !== 'all' ? { status: statusFilter } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      setNewProject({ title: '', description: '' });
      toast({ title: 'Project created', description: 'Your new project has been created.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create project.', variant: 'destructive' });
    },
  });

  const allProjects: Project[] = projectsQuery.data ?? [];

  // Client-side search filter
  const projects = searchTerm
    ? allProjects.filter((p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allProjects;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[17px] font-bold tracking-tight font-display">Projects</h1>
          <p className="text-sm text-muted-foreground font-sans mt-1">Manage your manufacturing projects from ideation to shipment.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" variant="outline" className="rounded-md">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search + filter pills */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <label htmlFor="project-search" className="sr-only">Search projects</label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="project-search"
            placeholder="Search projects by title..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {tab.value !== 'all' && (
                <span className={cn('mr-1.5 h-2 w-2 rounded-full', statusDotColors[tab.value] ?? 'bg-muted-foreground')} />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project grid */}
      {projectsQuery.isLoading ? (
        <ProjectsSkeleton />
      ) : projectsQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive text-sm">
            Failed to load projects. Please try again.
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <p className="text-sm font-semibold font-display text-muted-foreground mb-1">No projects yet</p>
            <p className="text-sm text-muted-foreground/70 mb-5 max-w-xs text-center font-sans">
              Create your first project to get started.
            </p>
            <Button onClick={() => setDialogOpen(true)} size="sm" variant="outline" className="rounded-md">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project: Project, i: number) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      )}

      {/* Create project dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Create New Project</DialogTitle>
            <DialogDescription className="font-sans">
              Start a new manufacturing project. You can add details later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="new-project-title" className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">Project Name</label>
              <Input
                id="new-project-title"
                placeholder="e.g., Spring Collection 2026"
                value={newProject.title}
                onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="new-project-description" className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">Description</label>
              <Textarea
                id="new-project-description"
                placeholder="Describe what you want to manufacture..."
                value={newProject.description}
                onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-md">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newProject)}
              disabled={!newProject.title.trim() || createMutation.isPending}
              className="rounded-md"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
