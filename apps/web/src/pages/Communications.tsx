import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, Clock, CheckCircle2, AlertCircle, Plus, Inbox, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { communicationsApi, type Communication, type Message } from '@/lib/api';
import { formatRelativeDate, formatDateTime, cn } from '@/lib/utils';
import { MessageComposer } from './MessageComposer';

const statusConfig = {
  awaiting_reply: { label: 'Awaiting', icon: Clock, variant: 'warning' as const },
  reply_received: { label: 'Received', icon: CheckCircle2, variant: 'success' as const },
  follow_up_due: { label: 'Follow-up', icon: AlertCircle, variant: 'destructive' as const },
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
  const projectName = projectNames[thread.projectId] ?? thread.projectId;

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
          thread.status === 'reply_received' ? 'text-emerald-500' :
          thread.status === 'follow_up_due' ? 'text-rose-500' : 'text-amber-500'
        )} />
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{projectName}</Badge>
        <span className="text-[10px] text-muted-foreground data-value">{formatRelativeDate(thread.lastMessageAt)}</span>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-xl px-4 py-3',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className={cn('text-[10px] mt-1.5 data-value', isUser ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
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
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-select first thread
  useEffect(() => {
    if (!selectedThread && threads.length > 0) {
      setSelectedThread(threads[0].id);
    }
  }, [threads, selectedThread]);

  // Scroll to bottom when thread changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.id, activeThread?.messages.length]);

  const handleSendReply = () => {
    if (!replyText.trim() || !activeThread) return;
    // In demo mode, just clear the input (no backend)
    setReplyText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  if (composerOpen) {
    return <MessageComposer onClose={() => setComposerOpen(false)} />;
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
            {threadsQuery.isLoading ? (
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
                  active={selectedThread === thread.id}
                  onClick={() => setSelectedThread(thread.id)}
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
                        {projectNames[activeThread.projectId] ?? 'Project'}
                      </Link>
                    </div>
                  </div>
                  <Badge variant={statusConfig[activeThread.status].variant}>
                    {statusConfig[activeThread.status].label}
                  </Badge>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-5 space-y-3">
                {activeThread.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Reply input */}
              <div className="border-t p-3 shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    className="flex-1 h-9 text-sm"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9"
                    disabled={!replyText.trim()}
                    onClick={handleSendReply}
                  >
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
