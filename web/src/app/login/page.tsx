import { signInWithPassword, signUpParentAccount } from "./actions";
import { Compass, LogIn } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SearchParamValue = string | string[] | undefined;
type SearchParams =
  | Record<string, SearchParamValue>
  | Promise<Record<string, SearchParamValue>>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = resolvedSearchParams.error;
  const info = resolvedSearchParams.info;
  const errorMessage = Array.isArray(error) ? error[0] : error;
  const infoMessage = Array.isArray(info) ? info[0] : info;

  return (
    <main className="min-h-screen px-4 py-12">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-emerald-600" aria-hidden />
            Young Men Camp Tracker
          </CardTitle>
          <p className="text-sm text-slate-600">
            Sign in to view your ward roster, registration status, and shirt-size
            progress.
          </p>
        </CardHeader>
        <CardContent>
          {infoMessage ? (
            <Alert variant="success" className="mb-4">
              {infoMessage}
            </Alert>
          ) : null}

          {errorMessage ? (
            <Alert variant="destructive" className="mb-4">
              {errorMessage}
            </Alert>
          ) : null}

          <form action={signInWithPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="leader@example.org"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full">
              <LogIn className="h-4 w-4" aria-hidden />
              Sign In
            </Button>
          </form>

          <div className="my-6 h-px bg-slate-200" />

          <form action={signUpParentAccount} className="space-y-4">
            <p className="text-sm font-medium text-slate-700">
              Parent first-time setup
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                required
                placeholder="Parent/Guardian name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup_email">Email</Label>
              <Input
                id="signup_email"
                name="signup_email"
                type="email"
                required
                placeholder="parent@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup_password">Password</Label>
              <Input
                id="signup_password"
                name="signup_password"
                type="password"
                minLength={8}
                required
                placeholder="At least 8 characters"
              />
            </div>

            <Button type="submit" variant="outline" className="w-full">
              Create Parent Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
