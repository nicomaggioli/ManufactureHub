import { useState, useEffect } from 'react';
import { User, Bell, Link2, Save } from 'lucide-react';
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

const STORAGE_KEY = 'ravi-user-settings';

const integrations = [
  { name: 'Slack', description: 'Get notifications in Slack', connected: false },
  { name: 'Google Drive', description: 'Sync design assets', connected: true },
  { name: 'Shopify', description: 'Sync product data', connected: false },
  { name: 'QuickBooks', description: 'Sync invoices and quotes', connected: false },
];

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function Settings() {
  const { user } = useAuth();
  const saved = loadSettings();

  const [firstName, setFirstName] = useState(saved?.firstName || user?.firstName || '');
  const [lastName, setLastName] = useState(saved?.lastName || user?.lastName || '');
  const [email, setEmail] = useState(saved?.email || user?.email || '');
  const [digestFrequency, setDigestFrequency] = useState(saved?.digestFrequency || 'daily');
  const [emailNotifications, setEmailNotifications] = useState(saved?.emailNotifications ?? true);
  const [reminderNotifications, setReminderNotifications] = useState(saved?.reminderNotifications ?? true);
  const [quoteNotifications, setQuoteNotifications] = useState(saved?.quoteNotifications ?? true);
  const [sampleNotifications, setSampleNotifications] = useState(saved?.sampleNotifications ?? true);

  // Sync from user if settings change externally
  useEffect(() => {
    if (!saved && user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = () => {
    const settings = {
      firstName,
      lastName,
      email,
      digestFrequency,
      emailNotifications,
      reminderNotifications,
      quoteNotifications,
      sampleNotifications,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    // Reload to reflect name changes in header
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card className="animate-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
              {firstName?.[0] || 'U'}
            </div>
            <div>
              <p className="text-base font-semibold">{firstName} {lastName}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">First Name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Last Name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              <p className="text-xs text-muted-foreground">Used for notifications and login.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="animate-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Control how and when you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email Digest</label>
            <Select value={digestFrequency} onValueChange={setDigestFrequency}>
              <SelectTrigger className="w-48 h-9 text-sm">
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

          <div className="space-y-3">
            {[
              { label: 'Email notifications', desc: 'Receive notifications via email', checked: emailNotifications, toggle: () => setEmailNotifications(!emailNotifications) },
              { label: 'Reminder alerts', desc: 'Get notified about upcoming reminders', checked: reminderNotifications, toggle: () => setReminderNotifications(!reminderNotifications) },
              { label: 'Quote updates', desc: 'Notifications when quotes are received or expire', checked: quoteNotifications, toggle: () => setQuoteNotifications(!quoteNotifications) },
              { label: 'Sample tracking', desc: 'Updates on sample shipment status', checked: sampleNotifications, toggle: () => setSampleNotifications(!sampleNotifications) },
            ].map((item) => (
              <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={item.toggle}
                  className="rounded border-input h-4 w-4"
                />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="animate-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Integrations</CardTitle>
          </div>
          <CardDescription>Manage third-party connections.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{integration.name}</p>
                    {integration.connected && (
                      <Badge variant="success" className="text-[10px]">Connected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                </div>
                <Button variant={integration.connected ? 'outline' : 'default'} size="sm">
                  {integration.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-4">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
