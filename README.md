# Offline Spotify

A Progressive Web App (PWA) built with Next.js and Shadcn UI that allows you to connect to your Spotify account, download playlists, and listen to music offline.

## Features

- Spotify Authentication
- Browse your playlists
- Play music with a built-in player
- Download songs for offline use
- PWA capabilities for desktop and mobile installation
- Works offline once content is downloaded

## Prerequisites

- Node.js and npm installed
- Spotify Premium account
- Spotify Developer account for API access

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/offline-spotify.git
cd offline-spotify
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Spotify API credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new application
3. Add `http://localhost:3000/api/auth/callback/spotify` as a Redirect URI
4. Copy the Client ID and Client Secret
5. Create a `.env.local` file from the example:

```bash
cp .env.example .env.local
```

6. Edit the `.env.local` file with your credentials:

```
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify
NEXTAUTH_SECRET=your_random_string_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

### 5. Build for production

```bash
npm run build
npm start
```

## Installing as a PWA

1. Open the website in Chrome or a compatible browser
2. Look for the "Install" icon in the address bar or menu
3. Follow the prompts to install the app

## How It Works

- The app connects to Spotify's API using OAuth authentication
- User playlists and tracks are fetched and displayed
- When you download a track, it's stored in IndexedDB for offline use
- The app uses service workers for offline functionality
- Spotify's preview URLs are used for playback (30-second clips)

## Limitations

- Only 30-second track previews are available due to Spotify's API restrictions
- Full tracks cannot be downloaded due to Spotify's terms of service
- Requires Spotify Premium for full functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Next PWA](https://github.com/DuCanhGH/next-pwa)
