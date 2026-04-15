import Link from "next/link";
import { LogIn, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-amber-600" aria-hidden />
            You are offline
          </CardTitle>
          <p className="text-sm text-slate-600">
            Check your internet connection and try again. If you already visited
            a page recently, it may still load from local cache.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">
              <LogIn className="h-4 w-4" aria-hidden />
              Go to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
