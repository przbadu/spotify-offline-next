"use client";

import { useState, useRef, useEffect } from "react";
import { SpotifyTrack } from "../types";
import Image from "next/image";
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicPlayerProps {
  track: SpotifyTrack;
  onNext?: () => void;
  onPrevious?: () => void;
  onDownload?: () => Promise<void>;
  isOffline?: boolean;
}

const MusicPlayer = ({
  track,
  onNext,
  onPrevious,
  onDownload,
  isOffline = false
}: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isDownloading, setIsDownloading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Audio source - use preview URL or offline URL
  const audioSource = track.offlineUrl || track.preview_url;

  useEffect(() => {
    // Reset state when track changes
    setIsPlaying(false);
    setCurrentTime(0);

    // Play automatically when a new track is loaded
    const playNewTrack = async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch {
          console.log("Auto-play prevented by browser");
        }
      }
    };

    // Let the audio load first
    const timer = setTimeout(() => {
      playNewTrack();
    }, 100);

    return () => clearTimeout(timer);
  }, [track.id]);

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  // Handle play/pause
  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }

    setIsPlaying(!isPlaying);
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!onDownload) return;

    setIsDownloading(true);
    try {
      await onDownload();
    } catch (error) {
      console.error("Error downloading track:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Format time (e.g., 3:45)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="w-full bg-card shadow-lg rounded-lg p-4 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          {track.album?.images?.[0]?.url ? (
            <Image
              src={track.album.images[0].url}
              alt={track.name}
              className="object-cover rounded-md"
              fill
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No Cover</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">{track.name}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {track.artists.map(a => a.name).join(", ")}
          </p>
        </div>

        {onDownload && !track.isDownloaded && !isOffline && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={cn(
              "p-2 rounded-full hover:bg-accent",
              isDownloading && "opacity-50 cursor-not-allowed"
            )}
            title="Download for offline use"
          >
            <Download className="h-5 w-5" />
          </button>
        )}

        {track.isDownloaded && (
          <div
            className="p-2 text-green-500"
            title="Available offline"
          >
            <Download className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {/* Seek bar */}
        <div className="flex items-center space-x-2">
          <span className="text-xs w-8 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 30}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-muted appearance-none cursor-pointer rounded-full accent-primary flex-1 focus:outline-none"
          />
          <span className="text-xs w-8">{formatTime(duration || 30)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="p-2 rounded-full hover:bg-accent"
            >
              <SkipBack className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </button>

          {onNext && (
            <button
              onClick={onNext}
              className="p-2 rounded-full hover:bg-accent"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Volume */}
        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1 bg-muted appearance-none cursor-pointer rounded-full accent-primary"
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioSource || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
        onLoadedMetadata={handleTimeUpdate}
        preload="metadata"
      />
    </div>
  );
};

export default MusicPlayer;
