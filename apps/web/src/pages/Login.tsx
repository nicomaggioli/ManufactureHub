import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('dev@sical.app');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    signIn();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[360px] space-y-6">
        {/* Logo + App Name */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold font-heading shadow-lg">
            S
          </div>
          <h1 className="text-xl font-bold font-heading tracking-tight mt-4">Sign in to Sical</h1>
          <p className="text-sm text-muted-foreground">Manufacturing management platform</p>
        </div>

        <div className="bg-white border border-border/60 rounded-2xl p-6 shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter any password"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/50">
          Demo Mode &mdash; any credentials work
        </p>
      </div>
    </div>
  );
}
