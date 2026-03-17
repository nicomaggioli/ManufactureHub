import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { MessageSquare, Send, CheckCircle2, Plus, Inbox, ArrowUpRight, Archive, XCircle, FileEdit, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { communicationsApi, type Communication } from '@/lib/api';
import { formatRelativeDate, formatDateTime, cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', icon: FileEdit, variant: 'secondary' },
  sent: { label: 'Sent', icon: Send, variant: 'default' },
  delivered: { label: 'Delivered', icon: CheckCircle2, variant: 'default' },
  failed: { label: 'Failed', icon: XCircle, variant: 'destructive' },
  archived: { label: 'Archived', icon: Archive, variant: 'outline' },
};

interface Thread {
  id: string;
  subject: string;
  manufacturerId: string;
  manufacturerName: string;
  projectId: string;
  projectTitle: string;
  messages: Communication[];
  lastMessageAt: string;
  latestStatus: string;
}

function groupIntoThreads(comms: Communication[]): Thread[] {
  const map = new Map<string, Communication[]>();
  for (const c of comms) {
    // Group by manufacturer + base subject (strip "Re: " prefixes)
    const baseSubject = (c.subject ?? '').replace(/^Re:\s*/i, '');
    const key = `${c.manufacturerId}::${baseSubject}`;
    const existing = map.get(key) ?? [];
    existing.push(c);
    map.set(key, existing);
  }

  const threads: Thread[] = [];
  for (const [, msgs] of map) {
    const sorted = msgs.sort((a, b) => new Date(a.sentAt ?? a.createdAt).getTime() - new Date(b.sentAt ?? b.createdAt).getTime());
    const latest = sorted[sorted.length - 1];
    const first = sorted[0];
    threads.push({
      id: first.id,
      subject: (first.subject ?? '').replace(/^Re:\s*/i, ''),
      manufacturerId: first.manufacturerId,
      manufacturerName: first.manufacturer?.name ?? 'Unknown',
      projectId: first.projectId,
      projectTitle: first.project?.title ?? first.projectId,
      messages: sorted,
      lastMessageAt: latest.sentAt ?? latest.createdAt,
      latestStatus: latest.status,
    });
  }

  return threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

function ThreadListItem({
  thread,
  active,
  onClick,
}: {
  thread: Thread;
  active: boolean;
  onClick: () => void;
}) {
  const config = statusConfig[thread.latestStatus] ?? statusConfig.sent;
  const StatusIcon = config.icon;
  const lastMsg = thread.messages[thread.messages.length - 1];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg p-3 transition-colors',
        active ? 'bg-primary/8 border border-primary/20' : 'hover:bg-muted border border-transparent'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{thread.manufacturerName}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.subject}</p>
        </div>
        <StatusIcon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5',
          thread.latestStatus === 'delivered' ? 'text-emerald-500' :
          thread.latestStatus === 'failed' ? 'text-rose-500' : 'text-amber-500'
        )} />
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{thread.projectTitle}</Badge>
        <span className="text-[11px] text-muted-foreground">{formatRelativeDate(thread.lastMessageAt)}</span>
        {thread.messages.length > 1 && (
          <span className="text-[10px] text-muted-foreground/60">{thread.messages.length} msgs</span>
        )}
      </div>
    </button>
  );
}

function ComposeView({ onClose }: { onClose: () => void }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = async () => {
    if (!body.trim()) return;
    await communicationsApi.send({
      projectId: 'p1',
      manufacturerId: 'm1',
      subject,
      body,
      direction: 'sent',
      status: 'sent',
    });
    onClose();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">New Message</h1>
      </div>
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
            <Input placeholder="Manufacturer name or email..." value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
            <Input placeholder="Subject line..." value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
            <textarea
              className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend} disabled={!body.trim()}>
              <Send className="mr-2 h-4 w-4" /> Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Communications() {
  const { id: urlThreadId } = useParams<{ id?: string }>();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(urlThreadId ?? null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const commsQuery = useQuery<Communication[]>({
    queryKey: ['communications'],
    queryFn: () => communicationsApi.list(),
  });

  const allComms: Communication[] = commsQuery.data ?? [];
  const threads = useMemo(() => groupIntoThreads(allComms), [allComms]);

  const filteredThreads = searchTerm
    ? threads.filter(
        (t) =>
          t.manufacturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : threads;

  const activeThread = threads.find((t) => t.id === selectedThreadId);

  useEffect(() => {
    if (urlThreadId) setSelectedThreadId(urlThreadId);
  }, [urlThreadId]);

  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) setSelectedThreadId(threads[0].id);
  }, [threads, selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.id]);

  if (composerOpen) {
    return <ComposeView onClose={() => setComposerOpen(false)} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Conversations with manufacturers.</p>
        </div>
        <Button onClick={() => setComposerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Compose
        </Button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Thread list sidebar */}
        <Card className="w-80 shrink-0 flex flex-col overflow-hidden animate-in">
          <CardHeader className="pb-2.5 shrink-0 px-3 pt-3">
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
            />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {commsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 text-muted-foreground/40" />
                <p className="text-sm">No conversations</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  active={selectedThreadId === thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Message view */}
        <Card className="flex-1 flex flex-col overflow-hidden animate-in">
          {!activeThread ? (
            <CardContent className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-3 text-muted-foreground/30" />
              <p className="text-sm">Select a conversation to view messages</p>
              <Button variant="outline" className="mt-4" onClick={() => setComposerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Start New Conversation
              </Button>
            </CardContent>
          ) : (
            <>
              {/* Thread header */}
              <CardHeader className="border-b shrink-0 pb-3 pt-4 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">{activeThread.subject}</CardTitle>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Link
                        to={`/manufacturers/${activeThread.manufacturerId}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {activeThread.manufacturerName}
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      <span className="text-muted-foreground">·</span>
                      <Link
                        to={`/projects/${activeThread.projectId}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {activeThread.projectTitle}
                      </Link>
                    </div>
                  </div>
                  <Badge variant={(statusConfig[activeThread.latestStatus] ?? statusConfig.sent).variant}>
                    {(statusConfig[activeThread.latestStatus] ?? statusConfig.sent).label}
                  </Badge>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-5 space-y-3">
                {activeThread.messages.map((msg) => (
                  <div key={msg.id} className={cn('flex', msg.direction === 'sent' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[70%] rounded-xl px-4 py-3',
                        msg.direction === 'sent' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      <p className={cn('text-[11px] mt-1.5', msg.direction === 'sent' ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                        {formatDateTime(msg.sentAt ?? msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
