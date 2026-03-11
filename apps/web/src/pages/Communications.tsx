import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Send, Clock, CheckCircle2, AlertCircle, Plus, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { communicationsApi, type Communication, type Message } from '@/lib/api';
import { formatRelativeDate, formatDateTime, cn } from '@/lib/utils';
import { MessageComposer } from './MessageComposer';

const statusConfig = {
  awaiting_reply: { label: 'Awaiting Reply', icon: Clock, variant: 'warning' as const },
  reply_received: { label: 'Reply Received', icon: CheckCircle2, variant: 'success' as const },
  follow_up_due: { label: 'Follow-up Due', icon: AlertCircle, variant: 'destructive' as const },
};

function ThreadListItem({
  thread,
  active,
  onClick,
}: {
  thread: Communication;
  active: boolean;
  onClick: () => void;
}) {
  const config = statusConfig[thread.status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-md p-2.5 transition-colors',
        active ? 'bg-primary/8 border border-primary/20' : 'hover:bg-accent/50 border border-transparent'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{thread.manufacturerName}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.subject}</p>
        </div>
        <Badge variant={config.variant} className="shrink-0">
          <StatusIcon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 data-value">{formatRelativeDate(thread.lastMessageAt)}</p>
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-3.5 py-2.5',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className={cn('text-[10px] mt-1.5 data-value', isUser ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function Communications() {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const threadsQuery = useQuery({
    queryKey: ['communications'],
    queryFn: () => communicationsApi.list(),
  });

  const threads = threadsQuery.data ?? [];
  const filteredThreads = searchTerm
    ? threads.filter(
        (t) =>
          t.manufacturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : threads;

  const activeThread = threads.find((t) => t.id === selectedThread);

  // Group threads by manufacturer
  const groupedThreads = filteredThreads.reduce<Record<string, Communication[]>>((acc, thread) => {
    const key = thread.manufacturerName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(thread);
    return acc;
  }, {});

  if (composerOpen) {
    return <MessageComposer onClose={() => setComposerOpen(false)} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Communications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage conversations with manufacturers.</p>
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
          <CardContent className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
            {threadsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 text-muted-foreground/40" />
                <p className="text-sm">No conversations</p>
              </div>
            ) : (
              Object.entries(groupedThreads).map(([mfgName, mfgThreads]) => (
                <div key={mfgName}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 mb-1">{mfgName}</p>
                  <div className="space-y-0.5">
                    {mfgThreads.map((thread) => (
                      <ThreadListItem
                        key={thread.id}
                        thread={thread}
                        active={selectedThread === thread.id}
                        onClick={() => setSelectedThread(thread.id)}
                      />
                    ))}
                  </div>
                </div>
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
              <CardHeader className="border-b shrink-0 pb-2.5 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-heading text-sm font-semibold">{activeThread.subject}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeThread.manufacturerName}</p>
                  </div>
                  <Badge variant={statusConfig[activeThread.status].variant}>
                    {statusConfig[activeThread.status].label}
                  </Badge>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeThread.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </CardContent>

              {/* Reply input */}
              <div className="border-t p-3 shrink-0">
                <div className="flex gap-2">
                  <Input placeholder="Type your reply..." className="flex-1 h-9 text-sm" />
                  <Button size="icon" className="h-9 w-9">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
