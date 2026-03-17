import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  CheckCircle,
  AlertCircle,
  Plus,
  Inbox,
  ArrowUpRight,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { communicationsApi, type Communication } from '@/lib/api';

// Local Message type for demo-mode thread UI (backend Communication model is flat)
interface Message {
  id: string;
  sender: 'user' | 'manufacturer';
  content: string;
  createdAt: string;
  attachments?: string[];
}
import { formatRelativeDate, formatDateTime, cn } from '@/lib/utils';
import { MessageComposer } from './MessageComposer';

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: string }> = {
  draft: { label: 'Draft', icon: Clock, variant: 'outline' },
  sent: { label: 'Sent', icon: ArrowUpRight, variant: 'warning' },
  delivered: { label: 'Delivered', icon: CheckCircle, variant: 'default' },
  failed: { label: 'Failed', icon: AlertCircle, variant: 'destructive' },
  archived: { label: 'Archived', icon: CheckCircle, variant: 'secondary' },
};

// Map projectIds to names for breadcrumb context
const projectNames: Record<string, string> = {
  p1: 'Spring Collection 2026',
  p2: 'Denim Capsule Line',
  p3: 'Athleisure Basics',
  p4: 'Resort Swim 2027',
  p5: 'Winter Outerwear',
  p6: 'Leather Accessories',
  p7: 'Organic Kids Line',
};

function ManufacturerAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
      <span className="text-[11px] font-semibold text-muted-foreground">{initials}</span>
    </div>
  );
}

function ThreadListItem({
  thread,
  active,
  onClick,
}: {
  thread: Communication;
  active: boolean;
  onClick: () => void;
}) {
  const config = statusConfig[thread.status] ?? statusConfig.sent;
  const StatusIcon = config.icon;
  const mfrName = thread.manufacturer?.name ?? 'Unknown';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl p-3.5 transition-all',
        active ? 'bg-primary/8 border border-primary/20 shadow-sm' : 'hover:bg-muted/80 border border-transparent'
      )}
    >
      <div className="flex items-start gap-3">
        <ManufacturerAvatar name={mfrName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold truncate">{mfrName}</p>
            <span className="text-[11px] text-muted-foreground data-value shrink-0">
              {formatRelativeDate(thread.sentAt ?? thread.createdAt)}
            </span>
          </div>
          <p className="text-xs font-medium text-foreground/80 truncate mt-0.5">{thread.subject ?? 'No subject'}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5 line-clamp-1">{thread.body}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
          <StatusIcon className={cn('h-3.5 w-3.5',
            thread.status === 'delivered' ? 'text-emerald-500' :
            thread.status === 'failed' ? 'text-rose-500' : 'text-amber-500'
          )} />
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message, manufacturerName }: { message: Message; manufacturerName: string }) {
  const isUser = message.sender === 'user';
  return (
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && <ManufacturerAvatar name={manufacturerName} />}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        {!isUser && (
          <p className="text-[11px] font-medium text-muted-foreground mb-1">{manufacturerName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className={cn('text-[10px] mt-2 data-value', isUser ? 'text-primary-foreground/50' : 'text-muted-foreground/60')}>
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 border-t border-border/50" />
      <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">{date}</span>
      <div className="flex-1 border-t border-border/50" />
    </div>
  );
}

export function Communications() {
  const { id: urlThreadId } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<string | null>(urlThreadId ?? null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const threadsQuery = useQuery<Communication[]>({
    queryKey: ['communications'],
    queryFn: () => communicationsApi.list(),
  });

  const threads: Communication[] = threadsQuery.data ?? [];
  const filteredThreads = searchTerm
    ? threads.filter(
        (t) =>
          (t.manufacturer?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.subject ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : threads;

  const activeThread = threads.find((t) => t.id === selectedThread);

  // Sync selectedThread from URL param when it changes
  useEffect(() => {
    if (urlThreadId) {
      setSelectedThread(urlThreadId);
      setMobileShowDetail(true);
    }
  }, [urlThreadId]);

  // Auto-select first thread if none selected (desktop only)
  useEffect(() => {
    if (!selectedThread && threads.length > 0) {
      setSelectedThread(threads[0].id);
    }
  }, [threads, selectedThread]);

  // Scroll to bottom when thread changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.id]);

  const handleSelectThread = (id: string) => {
    setSelectedThread(id);
    setMobileShowDetail(true);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !activeThread) return;
    const now = new Date().toISOString();
    const newComm: Communication = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId: activeThread.projectId,
      manufacturerId: activeThread.manufacturerId,
      subject: activeThread.subject,
      body: replyText.trim(),
      direction: 'sent',
      status: 'sent',
      sentAt: now,
      createdAt: now,
      manufacturer: activeThread.manufacturer,
    };
    queryClient.setQueryData<Communication[]>(['communications'], (old) =>
      [newComm, ...(old ?? [])]
    );
    setReplyText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  if (composerOpen) {
    return <MessageComposer onClose={(newThreadId?: string) => {
      setComposerOpen(false);
      if (newThreadId) {
        setSelectedThread(newThreadId);
      }
    }} />;
  }

  // Group messages by date for separators
  const threadMessages = activeThread
    ? threads
        .filter((c) => c.manufacturerId === activeThread.manufacturerId && c.projectId === activeThread.projectId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const groupedMessages: { date: string; messages: Communication[] }[] = [];
  threadMessages.forEach((msg) => {
    const dateStr = new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateStr) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateStr, messages: [msg] });
    }
  });

  const manufacturerName = activeThread?.manufacturer?.name ?? 'Unknown';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Inbox</p>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Conversations with your manufacturers.</p>
        </div>
        <Button onClick={() => setComposerOpen(true)} className="rounded-lg">
          <Plus className="mr-2 h-4 w-4" />
          Compose
        </Button>
      </div>

      <div className="flex gap-0 h-[calc(100vh-220px)] rounded-xl border border-border overflow-hidden bg-background">
        {/* Thread list sidebar */}
        <div className={cn(
          'w-full sm:w-96 shrink-0 flex flex-col border-r border-border bg-muted/20',
          mobileShowDetail ? 'hidden sm:flex' : 'flex'
        )}>
          <div className="p-3 border-b border-border/50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-sm bg-background"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {threadsQuery.isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Inbox className="h-10 w-10 mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">No conversations</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Start a new conversation to get going.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  active={selectedThread === thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Message view */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          !mobileShowDetail ? 'hidden sm:flex' : 'flex'
        )}>
          {!activeThread ? (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground p-8">
              <div className="rounded-2xl bg-muted/60 p-5 mb-5">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="text-base font-medium mb-1">No conversation selected</p>
              <p className="text-sm text-muted-foreground/60 mb-5">Pick a conversation from the sidebar or start a new one.</p>
              <Button variant="outline" className="rounded-lg" onClick={() => setComposerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Start New Conversation
              </Button>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="border-b shrink-0 px-5 py-3.5 bg-background">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Mobile back button */}
                    <button
                      onClick={() => setMobileShowDetail(false)}
                      className="sm:hidden mt-0.5 p-1 rounded-lg hover:bg-muted"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <ManufacturerAvatar name={manufacturerName} />
                    <div>
                      <h2 className="text-sm font-semibold">{activeThread.subject ?? 'No subject'}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Link
                          to={`/manufacturers/${activeThread.manufacturerId}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {manufacturerName}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <span className="text-muted-foreground text-xs">in</span>
                        <Link
                          to={`/projects/${activeThread.projectId}`}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {projectNames[activeThread.projectId] ?? 'Project'}
                        </Link>
                      </div>
                    </div>
                  </div>
                  <Badge variant={(statusConfig[activeThread.status]?.variant ?? 'secondary') as any} className="shrink-0">
                    {statusConfig[activeThread.status]?.label ?? activeThread.status}
                  </Badge>
                </div>
              </div>

              {/* Messages - chat bubbles */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-muted/10">
                {groupedMessages.map((group) => (
                  <div key={group.date} className="space-y-3">
                    <DateSeparator date={group.date} />
                    {group.messages.map((c) => (
                      <MessageBubble
                        key={c.id}
                        message={{
                          id: c.id,
                          sender: c.direction === 'sent' ? 'user' : 'manufacturer',
                          content: c.body,
                          createdAt: c.sentAt ?? c.createdAt,
                        }}
                        manufacturerName={manufacturerName}
                      />
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="border-t p-4 shrink-0 bg-background">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      className="pr-4 h-11 text-sm rounded-xl bg-muted/30"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <Button
                    size="icon"
                    className="h-11 w-11 rounded-xl shrink-0"
                    disabled={!replyText.trim()}
                    onClick={handleSendReply}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
