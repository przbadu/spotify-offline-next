import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { SpotifyPlaylist } from '../types';
import { createSpotifyApi, getAllPlaylistsFromIndexedDB, savePlaylistToIndexedDB } from '../lib/spotify';

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
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

  // Fetch playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // If offline, get data from IndexedDB
        if (isOffline) {
          const offlinePlaylists = await getAllPlaylistsFromIndexedDB();
          setPlaylists(offlinePlaylists as SpotifyPlaylist[] || []);
          setIsLoading(false);
          return;
        }

        // Online: fetch from Spotify API
        if (!accessToken) {
          throw new Error('No access token available');
        }

        const spotifyApi = createSpotifyApi(accessToken, refreshToken || undefined);
        const response = await spotifyApi.getUserPlaylists({ limit: 50 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fetchedPlaylists: SpotifyPlaylist[] = response.body.items.map((item: Record<string, any>) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          images: item.images,
          owner: {
            id: item.owner.id,
            display_name: item.owner.display_name || '',
          },
          tracks: {
            total: item.tracks.total,
          },
          uri: item.uri,
          isDownloaded: false,
        }));

        // Save to IndexedDB for offline use
        for (const playlist of fetchedPlaylists) {
          await savePlaylistToIndexedDB(playlist);
        }

        setPlaylists(fetchedPlaylists);
      } catch (err) {
        console.error('Error fetching playlists:', err);
        setError('Failed to fetch playlists');

        // Try to get playlists from IndexedDB as fallback
        try {
          const offlinePlaylists = await getAllPlaylistsFromIndexedDB();
          if (offlinePlaylists && offlinePlaylists.length > 0) {
            setPlaylists(offlinePlaylists as SpotifyPlaylist[]);
            setError('Using cached playlists - some data may be outdated');
          }
        } catch (offlineErr) {
          console.error('Error fetching offline playlists:', offlineErr);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken || isOffline) {
      fetchPlaylists();
    }
  }, [accessToken, refreshToken, isOffline]);

  return { playlists, isLoading, error, isOffline };
};

export default usePlaylists;
