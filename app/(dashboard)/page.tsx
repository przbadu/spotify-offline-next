"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import usePlaylists from "../hooks/usePlaylists";
import { useAuthStore, selectIsAuthenticated } from "../store/authStore";
import PlaylistCard from "../components/PlaylistCard";
import { Card } from "@/components/ui/card";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { playlists, isLoading, error, isOffline } = usePlaylists();
  const isAuthenticated = selectIsAuthenticated(useAuthStore.getState());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && !isAuthenticated) {
      router.push("/login");
    }
  }, [status, isAuthenticated, router]);

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Playlists</h1>
        <div className="flex items-center">
          {isOffline ? (
            <div className="flex items-center text-amber-500">
              <WifiOff className="h-4 w-4 mr-2" />
              <span className="text-sm">Offline Mode</span>
            </div>
          ) : (
            <div className="flex items-center text-green-500">
              <Wifi className="h-4 w-4 mr-2" />
              <span className="text-sm">Online</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-amber-700">{error}</p>
        </Card>
      )}

      {playlists.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isOffline
              ? "No saved playlists available offline"
              : "No playlists found in your Spotify account"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  );
}
