import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Send, Copy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { aiApi, projectsApi, manufacturersApi, communicationsApi, type Communication } from '@/lib/api';

const messageTypes = [
  { value: 'initial_inquiry', label: 'Initial Inquiry' },
  { value: 'rfq', label: 'Request for Quote' },
  { value: 'sample_request', label: 'Sample Request' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'order_confirmation', label: 'Order Confirmation' },
  { value: 'quality_concern', label: 'Quality Concern' },
  { value: 'general', label: 'General' },
];

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'direct', label: 'Direct' },
  { value: 'persuasive', label: 'Persuasive' },
];

interface MessageComposerProps {
  onClose: (newThreadId?: string) => void;
}

export function MessageComposer({ onClose }: MessageComposerProps) {
  const queryClient = useQueryClient();
  const [messageType, setMessageType] = useState('');
  const [projectId, setProjectId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [tone, setTone] = useState('professional');
  const [context, setContext] = useState('');
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState('');

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const manufacturersQuery = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturersApi.list(),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      aiApi.generateDraft({
        messageType,
        projectId: projectId || undefined,
        manufacturerId: manufacturerId || undefined,
        tone,
        context: context || undefined,
      }),
    onSuccess: (data) => {
      setDraft(data.draft);
      toast({ title: 'Draft generated', description: 'AI has prepared a message draft for you.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to generate draft.', variant: 'destructive' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      communicationsApi.send({
        projectId,
        manufacturerId,
        subject,
        body: draft,
        direction: 'sent',
      }),
    onSuccess: () => {
      const now = new Date().toISOString();
      const newThreadId = `comm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const selectedManufacturer = manufacturers.find((m: { id: string; name: string }) => m.id === manufacturerId);
      const newThread: Communication = {
        id: newThreadId,
        projectId,
        manufacturerId,
        subject: subject || 'New Conversation',
        body: draft,
        direction: 'sent',
        status: 'sent',
        sentAt: now,
        createdAt: now,
        manufacturer: selectedManufacturer ? { id: selectedManufacturer.id, name: selectedManufacturer.name } : undefined,
      };
      queryClient.setQueryData<Communication[]>(['communications'], (old) =>
        [newThread, ...(old ?? [])]
      );
      toast({ title: 'Sent', description: 'Your message has been sent.' });
      onClose(newThreadId);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft);
    toast({ title: 'Copied', description: 'Draft copied to clipboard.' });
  };

  const projects = projectsQuery.data ?? [];
  const manufacturers = manufacturersQuery.data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => onClose()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Message Composer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Draft messages with AI assistance.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Configuration */}
        <Card className="animate-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Message Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Message Type</label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  {messageTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Project (optional)</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsQuery.isLoading ? (
                    <div className="p-2"><Skeleton className="h-6 w-full" /></div>
                  ) : (
                    projects.map((p: { id: string; title: string }) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Manufacturer</label>
              <Select value={manufacturerId} onValueChange={setManufacturerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturersQuery.isLoading ? (
                    <div className="p-2"><Skeleton className="h-6 w-full" /></div>
                  ) : (
                    manufacturers.map((m: { id: string; name: string }) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Additional Context (optional)</label>
              <Textarea
                placeholder="Any specific details or requirements to include..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => generateMutation.mutate()}
              disabled={!messageType || generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Draft
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Draft area */}
        <Card className="animate-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Message Draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <Input
                placeholder="Message subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Message</label>
              <Textarea
                placeholder="Your message will appear here after generation, or type manually..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={14}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => sendMutation.mutate()}
                disabled={!draft.trim() || !manufacturerId || sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send
              </Button>
              <Button variant="outline" onClick={handleCopy} disabled={!draft.trim()}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
