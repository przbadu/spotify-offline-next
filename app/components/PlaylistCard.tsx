"use client";

import { SpotifyPlaylist } from "../types";
import Image from "next/image";
import Link from "next/link";
import { Download, Music } from "lucide-react";

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
}

const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
  const coverImage = playlist.images?.[0]?.url || "";

  return (
    <Link href={`/playlist/${playlist.id}`} className="group">
      <div className="space-y-3 p-3 bg-background rounded-lg border shadow-sm hover:shadow-md transition-all duration-300">
        <div className="overflow-hidden rounded-md relative aspect-square">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={playlist.name}
              className="object-cover w-full h-full transition-all duration-500 group-hover:scale-105"
              width={200}
              height={200}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          {playlist.isDownloaded && (
            <div className="absolute bottom-2 right-2 bg-green-500 p-1 rounded-full">
              <Download className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <div className="space-y-1 text-sm">
          <h3 className="font-semibold leading-none line-clamp-1">{playlist.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {playlist.description || `By ${playlist.owner.display_name}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {playlist.tracks.total} tracks
          </p>
        </div>
      </div>
    </Link>
  );
};

export default PlaylistCard;
