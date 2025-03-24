"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useAuthStore } from "@/app/store/authStore";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Music } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  // Handle successful authentication
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const { accessToken, refreshToken, expiresAt } = session.user as any;

      if (accessToken && refreshToken && expiresAt) {
        // Store auth data in zustand store
        login(
          session?.user,
          accessToken,
          refreshToken,
          (expiresAt - Math.floor(Date.now() / 1000))
        );

        // Redirect to dashboard
        router.push("/");
      }
    }
  }, [session, status, login, router]);

  // Handle login with Spotify
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("spotify", { callbackUrl: "/" });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md mx-auto space-y-8 bg-card p-8 rounded-lg shadow-lg">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Music className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Offline Spotify</h1>
          <p className="text-muted-foreground">Login to access your music library</p>
        </div>

        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
        >
          {isLoading ? "Connecting..." : "Connect with Spotify"}
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          <p>You'll need a Spotify Premium account</p>
          <p>to use all features of this application.</p>
        </div>
      </div>
    </div>
  );
}
