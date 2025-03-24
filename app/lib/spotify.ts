import SpotifyWebApi from "spotify-web-api-node";

const scopes = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-top-read",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-recently-played",
  "streaming",
];

// Initialize Spotify API client without credentials
export const spotifyApi = new SpotifyWebApi();

// Function to create a Spotify API client with credentials
export const createSpotifyApi = (
  accessToken: string,
  refreshToken?: string
) => {
  const api = new SpotifyWebApi({
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
  });

  api.setAccessToken(accessToken);
  if (refreshToken) {
    api.setRefreshToken(refreshToken);
  }

  return api;
};

// Helper function to refresh the access token
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const api = new SpotifyWebApi({
      clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
      refreshToken,
    });

    const data = await api.refreshAccessToken();
    return {
      accessToken: data.body.access_token,
      expiresIn: data.body.expires_in,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    throw error;
  }
};

// Export authorization URL getter 
export const getAuthUrl = () => {
  const api = new SpotifyWebApi({
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
  });

  return api.createAuthorizeURL(scopes, "spotify-auth-state");
};

// Offline storage helpers using IndexedDB
export const setupIndexedDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject("IndexedDB not supported");
      return;
    }

    const request = indexedDB.open("OfflineSpotify", 1);

    request.onerror = (event) => {
      reject("Error opening IndexedDB");
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // Create object stores for tracks, playlists and user data
      if (!db.objectStoreNames.contains("tracks")) {
        const tracksStore = db.createObjectStore("tracks", { keyPath: "id" });
        tracksStore.createIndex("lastAccessed", "lastAccessed", { unique: false });
      }

      if (!db.objectStoreNames.contains("playlists")) {
        db.createObjectStore("playlists", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("userData")) {
        db.createObjectStore("userData", { keyPath: "key" });
      }
    };
  });
};

// Function to save a track to IndexedDB
export const saveTrackToIndexedDB = async (
  track: any,
  audioBlob: Blob
): Promise<void> => {
  const db = await setupIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["tracks"], "readwrite");
    const tracksStore = transaction.objectStore("tracks");

    const trackData = {
      id: track.id,
      track: track,
      audioBlob: audioBlob,
      lastAccessed: new Date().toISOString(),
      size: audioBlob.size
    };

    const request = tracksStore.put(trackData);

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Error saving track to IndexedDB");
  });
};

// Function to get a track from IndexedDB
export const getTrackFromIndexedDB = async (trackId: string): Promise<any> => {
  const db = await setupIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["tracks"], "readonly");
    const tracksStore = transaction.objectStore("tracks");

    const request = tracksStore.get(trackId);

    request.onsuccess = () => {
      if (request.result) {
        // Update last accessed date
        const updateTransaction = db.transaction(["tracks"], "readwrite");
        const updateStore = updateTransaction.objectStore("tracks");
        request.result.lastAccessed = new Date().toISOString();
        updateStore.put(request.result);

        resolve(request.result);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => reject("Error getting track from IndexedDB");
  });
};

// Function to save a playlist to IndexedDB
export const savePlaylistToIndexedDB = async (playlist: any): Promise<void> => {
  const db = await setupIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["playlists"], "readwrite");
    const playlistsStore = transaction.objectStore("playlists");

    const playlistData = {
      id: playlist.id,
      playlist: playlist,
      lastSyncedAt: new Date().toISOString()
    };

    const request = playlistsStore.put(playlistData);

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Error saving playlist to IndexedDB");
  });
};

// Function to get all playlists from IndexedDB
export const getAllPlaylistsFromIndexedDB = async (): Promise<any[]> => {
  const db = await setupIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["playlists"], "readonly");
    const playlistsStore = transaction.objectStore("playlists");

    const request = playlistsStore.getAll();

    request.onsuccess = () => {
      resolve(request.result.map(item => item.playlist));
    };

    request.onerror = () => reject("Error getting playlists from IndexedDB");
  });
};
