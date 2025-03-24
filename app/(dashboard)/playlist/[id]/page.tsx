"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SpotifyTrack, SpotifyPlaylist } from "@/app/types";
import useTracks from "@/app/hooks/useTracks";
import { useAuthStore, selectIsAuthenticated } from "@/app/store/authStore";
import MusicPlayer from "@/app/components/MusicPlayer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Music, Clock, Wifi, WifiOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { createSpotifyApi } from "@/app/lib/spotify";

export default function PlaylistPage() {
  const router = useRouter();
  const params = useParams();
  const playlistId = params.id as string;
  const { status } = useSession();
  const { accessToken, refreshToken } = useAuthStore();
  const isAuthenticated = selectIsAuthenticated(useAuthStore.getState());

  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [playlistDetails, setPlaylistDetails] = useState<SpotifyPlaylist | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  const { tracks, isLoading, error, isOffline, downloadTrack } = useTracks(playlistId);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && !isAuthenticated) {
      router.push("/login");
    }
  }, [status, isAuthenticated, router]);

  // Fetch playlist details
  useEffect(() => {
    const fetchPlaylistDetails = async () => {
      if (!accessToken || !playlistId || isOffline) {
        setIsLoadingDetails(false);
        return;
      }

      try {
        const spotifyApi = createSpotifyApi(accessToken, refreshToken || undefined);
        const response = await spotifyApi.getPlaylist(playlistId);
        setPlaylistDetails(response.body as unknown as SpotifyPlaylist);
      } catch (err) {
        console.error("Error fetching playlist details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchPlaylistDetails();
  }, [accessToken, refreshToken, playlistId, isOffline]);

  // Set first track as current track when tracks are loaded
  useEffect(() => {
    if (tracks.length > 0 && currentIndex === -1) {
      // Find first playable track (with preview URL or downloaded)
      const firstPlayableIndex = tracks.findIndex(
        track => track.preview_url || track.offlineUrl
      );

      if (firstPlayableIndex !== -1) {
        setCurrentIndex(firstPlayableIndex);
        setCurrentTrack(tracks[firstPlayableIndex]);
      }
    }
  }, [tracks, currentIndex]);

  // Handle track playback
  const handlePlayTrack = (track: SpotifyTrack, index: number) => {
    setCurrentTrack(track);
    setCurrentIndex(index);
  };

  // Handle next track
  const handleNextTrack = () => {
    if (tracks.length === 0 || currentIndex === -1) return;

    // Find next playable track
    let nextIndex = currentIndex;
    let foundPlayable = false;

    while (!foundPlayable && nextIndex < tracks.length - 1) {
      nextIndex++;
      if (tracks[nextIndex].preview_url || tracks[nextIndex].offlineUrl) {
        foundPlayable = true;
      }
    }

    if (foundPlayable) {
      setCurrentIndex(nextIndex);
      setCurrentTrack(tracks[nextIndex]);
    }
  };

  // Handle previous track
  const handlePreviousTrack = () => {
    if (tracks.length === 0 || currentIndex <= 0) return;

    // Find previous playable track
    let prevIndex = currentIndex;
    let foundPlayable = false;

    while (!foundPlayable && prevIndex > 0) {
      prevIndex--;
      if (tracks[prevIndex].preview_url || tracks[prevIndex].offlineUrl) {
        foundPlayable = true;
      }
    }

    if (foundPlayable) {
      setCurrentIndex(prevIndex);
      setCurrentTrack(tracks[prevIndex]);
    }
  };

  // Handle download track
  const handleDownloadTrack = async (track: SpotifyTrack) => {
    if (!track.preview_url) {
      console.error("No preview URL available for this track");
      return;
    }

    try {
      await downloadTrack(track);
    } catch (err) {
      console.error("Failed to download track:", err);
    }
  };

  // Format duration (e.g., 3:45)
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Loading state
  if ((status === "loading" || isLoading || isLoadingDetails) && !isOffline) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const coverImage = playlistDetails?.images?.[0]?.url || "";
  const playlistName = playlistDetails?.name || "Playlist";
  const ownerName = playlistDetails?.owner?.display_name || "";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button
        variant="ghost"
        className="flex items-center"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="flex items-center space-x-4">
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

      {/* Playlist header */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-48 h-48 relative flex-shrink-0 overflow-hidden rounded-md shadow-md">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={playlistName}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 192px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Music className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-col text-center md:text-left">
          <span className="text-sm text-muted-foreground">Playlist</span>
          <h1 className="text-3xl font-bold md:text-4xl">{playlistName}</h1>
          {ownerName && (
            <p className="text-muted-foreground">By {ownerName}</p>
          )}
          <p className="text-muted-foreground">{tracks.length} tracks</p>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-amber-700">{error}</p>
        </Card>
      )}

      {/* Player (if a track is selected) */}
      {currentTrack && (
        <div className="py-2">
          <MusicPlayer
            track={currentTrack}
            onNext={handleNextTrack}
            onPrevious={handlePreviousTrack}
            onDownload={() => handleDownloadTrack(currentTrack)}
            isOffline={isOffline}
          />
        </div>
      )}

      {/* Track list */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-muted-foreground text-left">
              <th className="pb-2 pl-4">#</th>
              <th className="pb-2">Title</th>
              <th className="pb-2">Album</th>
              <th className="pb-2 text-right pr-4">
                <Clock className="h-4 w-4 inline" />
              </th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {tracks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                  {isOffline
                    ? "No tracks available offline for this playlist"
                    : "No tracks found in this playlist"}
                </td>
              </tr>
            ) : (
              tracks.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                const isPlayable = track.preview_url || track.offlineUrl;

                return (
                  <tr
                    key={track.id}
                    className={`group hover:bg-accent/50 ${isCurrentTrack ? 'bg-accent' : ''
                      } ${!isPlayable ? 'opacity-50' : ''
                      }`}
                    onClick={() => isPlayable && handlePlayTrack(track, index)}
                  >
                    <td className="py-2 pl-4 w-12">{index + 1}</td>
                    <td className="py-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 relative mr-3 flex-shrink-0">
                          {track.album?.images?.[0]?.url ? (
                            <Image
                              src={track.album.images[0].url}
                              alt={track.name}
                              className="object-cover rounded"
                              fill
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                              <Music className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{track.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {track.artists.map(a => a.name).join(", ")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 max-w-36 truncate">{track.album.name}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {formatDuration(track.duration_ms)}
                    </td>
                    <td className="py-2 pr-4 w-10 text-right">
                      {track.isDownloaded ? (
                        <Download className="h-4 w-4 text-green-500 ml-auto" />
                      ) : (
                        !isOffline && isPlayable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadTrack(track);
                            }}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          >
                            <Download className="h-4 w-4 hover:text-primary" />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
