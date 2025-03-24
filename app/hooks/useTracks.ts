import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { SpotifyTrack } from '../types';
import { createSpotifyApi, getTrackFromIndexedDB, saveTrackToIndexedDB } from '../lib/spotify';

export const useTracks = (playlistId: string) => {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const { accessToken, refreshToken } = useAuthStore();

  // Check online status
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Initial status check
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Download a track for offline use
  const downloadTrack = async (track: SpotifyTrack) => {
    if (!track.preview_url) {
      throw new Error('No preview URL available for this track');
    }

    try {
      // Fetch audio file
      const response = await fetch(track.preview_url);

      if (!response.ok) {
        throw new Error('Failed to fetch audio file');
      }

      const audioBlob = await response.blob();

      // Save to IndexedDB
      await saveTrackToIndexedDB({
        ...track,
        isDownloaded: true
      }, audioBlob);

      // Update track list
      setTracks(current =>
        current.map(t =>
          t.id === track.id ? { ...t, isDownloaded: true } : t
        )
      );

      return true;
    } catch (err) {
      console.error('Error downloading track:', err);
      throw err;
    }
  };

  // Fetch playlist tracks
  useEffect(() => {
    const fetchTracks = async () => {
      if (!playlistId) return;

      setIsLoading(true);
      setError(null);

      try {
        // If offline, check if we have local data
        if (isOffline) {
          // This would need to be implemented to fetch tracks from a specific playlist in IndexedDB
          setIsLoading(false);
          setError('Offline mode: Fetching playlist tracks from local storage not implemented yet');
          return;
        }

        // Online: fetch from Spotify API
        if (!accessToken) {
          throw new Error('No access token available');
        }

        const spotifyApi = createSpotifyApi(accessToken, refreshToken || undefined);

        // Fetch all tracks from playlist (handling pagination)
        let allTracks: SpotifyTrack[] = [];
        let offset = 0;
        const limit = 100;
        let hasMoreTracks = true;

        while (hasMoreTracks) {
          const response = await spotifyApi.getPlaylistTracks(playlistId, { limit, offset });

          const fetchedTracks: SpotifyTrack[] = response.body.items
            .filter(item => item.track) // Filter out null tracks
            .map(item => ({
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
                uri: artist.uri,
              })),
              album: {
                id: item.track.album.id,
                name: item.track.album.name,
                images: item.track.album.images,
                release_date: item.track.album.release_date,
                uri: item.track.album.uri,
              },
              duration_ms: item.track.duration_ms,
              preview_url: item.track.preview_url,
              uri: item.track.uri,
              is_playable: item.track.is_playable !== false, // Default to true if not specified
              explicit: item.track.explicit,
              isDownloaded: false, // Will be updated later
            }));

          allTracks = [...allTracks, ...fetchedTracks];

          offset += limit;
          hasMoreTracks = response.body.items.length === limit;
        }

        // Check which tracks are already downloaded
        const tracksWithDownloadStatus = await Promise.all(
          allTracks.map(async (track) => {
            const savedTrack = await getTrackFromIndexedDB(track.id);
            return {
              ...track,
              isDownloaded: !!savedTrack,
            };
          })
        );

        setTracks(tracksWithDownloadStatus);
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError('Failed to fetch tracks');
      } finally {
        setIsLoading(false);
      }
    };

    if ((accessToken || isOffline) && playlistId) {
      fetchTracks();
    }
  }, [accessToken, refreshToken, playlistId, isOffline]);

  return {
    tracks,
    isLoading,
    error,
    isOffline,
    downloadTrack,
  };
};

export default useTracks;
