import { useState } from 'react';
import { User, Bell, Link2, Mail, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';

const integrations = [
  { name: 'Slack', description: 'Get notifications in Slack', connected: false },
  { name: 'Google Drive', description: 'Sync design assets', connected: true },
  { name: 'Shopify', description: 'Sync product data', connected: false },
  { name: 'QuickBooks', description: 'Sync invoices and quotes', connected: false },
];

export function Settings() {
  const { user } = useAuth();
  const [digestFrequency, setDigestFrequency] = useState('daily');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [quoteNotifications, setQuoteNotifications] = useState(true);
  const [sampleNotifications, setSampleNotifications] = useState(true);

  const handleSave = () => {
    toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
                {user?.firstName?.[0] ?? 'U'}
              </div>
            )}
            <div>
              <p className="text-base font-semibold">{user?.fullName ?? 'User'}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? ''}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</label>
              <Input defaultValue={user?.firstName} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</label>
              <Input defaultValue={user?.lastName} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <Input defaultValue={user?.email} disabled />
              <p className="text-xs text-muted-foreground">Managed by your authentication provider.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notification Preferences
          </CardTitle>
          <CardDescription>Control how and when you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Digest Frequency</label>
            <Select value={digestFrequency} onValueChange={setDigestFrequency}>
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={() => setEmailNotifications(!emailNotifications)}
                className="rounded border-input"
              />
              <div>
                <p className="text-sm font-medium">Email notifications</p>
                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderNotifications}
                onChange={() => setReminderNotifications(!reminderNotifications)}
                className="rounded border-input"
              />
              <div>
                <p className="text-sm font-medium">Reminder alerts</p>
                <p className="text-xs text-muted-foreground">Get notified about upcoming reminders</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={quoteNotifications}
                onChange={() => setQuoteNotifications(!quoteNotifications)}
                className="rounded border-input"
              />
              <div>
                <p className="text-sm font-medium">Quote updates</p>
                <p className="text-xs text-muted-foreground">Notifications when quotes are received or expire</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sampleNotifications}
                onChange={() => setSampleNotifications(!sampleNotifications)}
                className="rounded border-input"
              />
              <div>
                <p className="text-sm font-medium">Sample tracking</p>
                <p className="text-xs text-muted-foreground">Updates on sample shipment status</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Connected Integrations */}
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Connected Integrations
          </CardTitle>
          <CardDescription>Manage third-party connections.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between rounded-md border p-3 hover:border-primary/20 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{integration.name}</p>
                    {integration.connected && (
                      <Badge variant="success">Connected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                </div>
                <Button variant={integration.connected ? 'outline' : 'default'} size="sm" className="h-7 text-xs">
                  {integration.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end pb-4">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
