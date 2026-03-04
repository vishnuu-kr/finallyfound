# FinallyFound 🎬✨

**Finally found.** – The vibe-based movie & TV recommender that actually gets you.

Tired of endless scrolling on Netflix/Prime? FinallyFound lets you build your perfect watch vibe by mixing moods, themes, genres, and even specific cast/director influences. No more generic suggestions – get hyper-personalized, high-quality recommendations (including global cinema – no language barriers) that feel like your next must-watch.

Live at: [https://finallyfound.app](https://finallyfound.app)

## Why FinallyFound? 🔥

- **Vibe-First Recommendations** – Combine moods like "Cozy", "High Tension", "Morally Grey Protagonist" with themes like "Cyberpunk", "Found Family", "Post-Apocalyptic".
- **Quick Genre/Mood Picker** – Instant adds: Happy, Sad, Thrilling, Romantic, Horror, Sci-Fi, etc.
- **Trending Matches** – See real-time suggestions with match % (e.g., 84% for The Bride!).
- **Cast & Director Deep Dives** – Select a movie → focus on director (e.g., Nolan) or cast → get the best next watches with reasoning.
- **Global & Diverse** – Hollywood, Bollywood, Korean, Malayalam, Japanese – all fair game for truly the best picks.
- **No endless scrolling** – Designed to end decision fatigue in minutes.

## Features

- **Build Your Vibe**: Mix & match moods/themes with an intuitive "Add" interface.
- **AI-Powered Blends**: Uses advanced LLM reasoning (CineMaster prompt engineering) for thoughtful, high-acclaim suggestions.
- **Trending Section**: Discover what's hot right now with vibe alignment.
- **Cast/Director Mode**: "Find similar to [Movie] directed by [Director]" → premium next-watch logic.
- **Loading Magic**: Fun cycling messages ("Analyzing...", "Curating hidden gems...") while fetching deep recs.
- **Mobile-Friendly**: Works great on phone for lazy couch decisions.
- 
## Roadmap / What's Next

- User accounts + saved vibes/watchlists
- Collaborative filtering (friends' tastes)
- More languages in UI (Malayalam support coming!)
- Self-hosted Ollama mode for true unlimited queries
- Mobile app (PWA or native)

## How to Run Locally (Dev Setup)

1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/finallyfound.git
   cd finallyfound
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
