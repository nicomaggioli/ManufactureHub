import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Factory, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'ideation', label: 'Ideation' },
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'sampling', label: 'Sampling' },
  { value: 'production', label: 'Production' },
  { value: 'shipped', label: 'Shipped' },
];

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'success' | 'warning'> = {
  ideation: 'secondary',
  sourcing: 'default',
  sampling: 'warning',
  production: 'outline',
  shipped: 'success',
};

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <Link to={`/projects/${project.id}`}>
      <Card
        className="stat-card cursor-pointer transition-all hover:shadow-md hover:border-border/80 animate-in"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-heading text-sm font-semibold leading-tight">
              {project.name}
            </CardTitle>
            <Badge variant={statusBadgeVariant[project.status] ?? 'outline'} className="shrink-0 text-[10px] uppercase tracking-wider">
              {project.status}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2 text-xs">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Factory className="h-3 w-3" />
              <span className="data-value">{project.manufacturerCount}</span> mfrs
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeDate(project.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="stat-card">
          <CardHeader className="p-4 pb-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-full mt-1.5" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-3 w-40" />
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
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const projectsQuery = useQuery({
    queryKey: ['projects', statusFilter !== 'all' ? statusFilter : undefined],
    queryFn: () => projectsApi.list(statusFilter !== 'all' ? { status: statusFilter } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      setNewProject({ name: '', description: '' });
      toast({ title: 'Project created', description: 'Your new project has been created.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create project.', variant: 'destructive' });
    },
  });

  const projects = projectsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your manufacturing projects</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-lg">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {projectsQuery.isLoading ? (
            <ProjectsSkeleton />
          ) : projectsQuery.isError ? (
            <Card className="stat-card">
              <CardContent className="py-10 text-center text-destructive text-sm">
                Failed to load projects. Please try again.
              </CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <Card className="stat-card border-dashed">
              <CardContent className="flex flex-col items-center py-16">
                <div className="rounded-lg bg-muted/60 p-4 mb-4">
                  <FolderKanban className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">No projects found</p>
                <p className="text-xs text-muted-foreground/70 mb-5">Get started by creating your first project</p>
                <Button onClick={() => setDialogOpen(true)} size="sm" className="rounded-lg">
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create project dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Create New Project</DialogTitle>
            <DialogDescription>
              Start a new manufacturing project. You can add details later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Project Name</label>
              <Input
                placeholder="e.g., Spring Collection 2026"
                value={newProject.name}
                onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
              <Textarea
                placeholder="Describe what you want to manufacture..."
                value={newProject.description}
                onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newProject)}
              disabled={!newProject.name.trim() || createMutation.isPending}
              className="rounded-lg"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
