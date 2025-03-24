// Spotify API types
export type SpotifyUser = {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  country: string;
  product: string;
};

export type SpotifyImage = {
  url: string;
  height: number;
  width: number;
};

export type SpotifyArtist = {
  id: string;
  name: string;
  images?: SpotifyImage[];
  uri: string;
};

export type SpotifyAlbum = {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  uri: string;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  uri: string;
  is_playable: boolean;
  explicit: boolean;
  // Additional properties for offline use
  offlineUrl?: string;
  isDownloaded?: boolean;
};

export type SpotifyPlaylist = {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  owner: {
    id: string;
    display_name: string;
  };
  tracks: {
    total: number;
    items?: Array<{
      track: SpotifyTrack;
      added_at: string;
    }>;
  };
  uri: string;
  // Additional properties for offline use
  isDownloaded?: boolean;
  lastSyncedAt?: string;
};

// Auth types
export type AuthState = {
  user: SpotifyUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isLoading: boolean;
  error: string | null;
};

// Player types
export type PlayerState = {
  currentTrack: SpotifyTrack | null;
  queue: SpotifyTrack[];
  isPlaying: boolean;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'track' | 'context';
  progress: number;
  duration: number;
};

// Offline storage types
export type OfflineTrack = {
  id: string;
  url: string;
  lastAccessed: string;
  size: number;
};

export type OfflineSyncState = {
  lastSynced: string | null;
  downloadInProgress: boolean;
  downloadProgress: number;
  availableStorage: number;
  usedStorage: number;
};