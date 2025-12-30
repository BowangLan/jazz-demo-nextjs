"use client";

import { useIsAuthenticated, useLogOut, useAgent, useJazzContext, useAuthSecretStorage } from "jazz-tools/react-core";
import { cojsonInternals } from "jazz-tools";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function Auth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const logOut = useLogOut();
  const agent = useAgent();
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Jazz Demo
                </p>
                <h1 className="text-4xl font-semibold tracking-tight">
                  Jazz-powered todo sprint.
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Signed in as
                  </p>
                  <p className="font-medium">
                    {agent.$isLoaded ? agent.profile?.name || "Anonymous" : "Loading..."}
                  </p>
                </div>
                <Button variant="outline" onClick={logOut}>
                  Log out
                </Button>
              </div>
            </div>
            <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
              A single shared todo list that syncs instantly between sessions.
            </p>
          </section>

          {children}
        </main>
      </div>
    );
  }

  // Create a deterministic secret from username/password
  const createSecretFromCredentials = async (username: string, password: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${username}:${password}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    // Take first 32 bytes as seed (256 bits)
    return hashArray.slice(0, 32);
  };

  const handleSignUp = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setError(null);

      // Generate account secret from username/password
      const secretSeed = await createSecretFromCredentials(username, password);
      const accountSecret = context.node.crypto.agentSecretFromSecretSeed(secretSeed);

      // Calculate account ID from account secret (deterministic)
      const accountID = cojsonInternals.idforHeader(
        cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret, context.node.crypto),
        context.node.crypto,
      ) as any;

      // Try to register the account (this will fail if it already exists)
      try {
        await context.register(accountSecret, { name: username });
      } catch (registerError) {
        // If registration fails, the account might already exist
        // Try to authenticate instead
        try {
          await context.authenticate({
            accountID,
            accountSecret,
          });
        } catch (authError) {
          throw new Error("Account already exists with different credentials or registration failed");
        }
      }

      // Store the credentials
      await authSecretStorage.set({
        accountID,
        secretSeed,
        accountSecret,
        provider: "username-password",
      });

      // Authenticate (if not already done)
      await context.authenticate({
        accountID,
        accountSecret,
      });

    } catch (err) {
      handleError(err as Error);
    }
  };

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setError(null);

      // Generate account secret from username/password
      const secretSeed = await createSecretFromCredentials(username, password);
      const accountSecret = context.node.crypto.agentSecretFromSecretSeed(secretSeed);

      // Calculate account ID from account secret
      const accountID = cojsonInternals.idforHeader(
        cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret, context.node.crypto),
        context.node.crypto,
      ) as any;

      // Try to authenticate
      await context.authenticate({
        accountID,
        accountSecret,
      });

      // Store the credentials
      await authSecretStorage.set({
        accountID,
        secretSeed,
        accountSecret,
        provider: "username-password",
      });

    } catch (err) {
      // If authentication fails, it might be because the account doesn't exist
      setError("Invalid username or password, or account doesn't exist. Please sign up first.");
    }
  };

  function handleError(error: Error) {
    if (error.cause instanceof Error) {
      setError(error.cause.message);
    } else {
      setError(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Jazz Demo
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Jazz-powered todo sprint.
          </h1>
          <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
            A single shared todo list that syncs instantly between sessions.
          </p>
        </section>

        <section className="grid gap-6">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
              <CardDescription>
                {isSignUp
                  ? "Create a new account to get started"
                  : "Sign in to your existing account"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isSignUp) {
                    handleSignUp();
                  } else {
                    handleSignIn();
                  }
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {isSignUp ? "Create Account" : "Sign In"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setUsername("");
                  setPassword("");
                }}
              >
                {isSignUp ? "Sign In Instead" : "Create Account"}
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
