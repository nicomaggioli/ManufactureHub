import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('dev@ravi.sys');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    signIn();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[320px] space-y-5">
        {/* Logo + App Name */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[inset_0_-1px_2px_rgba(0,0,0,0.15)] text-white text-2xl font-bold font-serif">
            R
          </div>
          <h1 className="text-xl font-semibold font-display tracking-tight mt-3">Sign in to RAVI</h1>
          <p className="text-sm text-muted-foreground">Manufacturing management platform</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label htmlFor="login-email" className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="login-password" className="text-xs font-medium text-muted-foreground">Password</label>
              <Input
                id="login-password"
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

        <p className="text-center text-overline text-muted-foreground/60">
          Demo Mode &mdash; any credentials work
        </p>
      </div>
    </div>
  );
}
