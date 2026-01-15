# Discord Film Bot 🎬

A Discord bot that uses [The Movie Database (TMDB)](https://www.themoviedb.org/) API to fetch information about movies, TV shows, and people.

This project is free to use and modify but you will need to create your own Discord bot and TMDB API key.

---

## Features
You can search for the following by using either a title/person's name/their TMDB ID or their IMDb ID.

- Search movies
- Search TV shows
- Search people (actors, directors, etc.)
- Uses Discord slash commands

---

## Requirements
- **Node.js** v18 or higher
- A **Discord bot token**
- A **TMDB API key & token**

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/mjcw88/discord-film-bot.git
cd discord-film-bot
```

### 2. Install dependencies
```bash 
npm install
```

### 3. Environment variables
Create a .env file in the root directory:
```bash
TOKEN = Your Discord bot token
CLIENT_ID = Your Discord application ID
GUILD_ID = Your Discord server ID
TMDB_API_KEY = Your TMDB API key
TMDB_API_TOKEN = Your TMDB API token
```
Never commit your .env file.

### 4. Register slash commands
Run this once (or whenever commands change):
```bash
node register-commands.js
```

---

### Running the Bot
#### Development

This project uses nodemon for development:
```bash
npm run dev
```

If nodemon is not installed globally:
```bash
npm install -g nodemon
```

#### Production
```bash
node index.js
```

### Commands

Example slash commands:

Using a title's name:

- **/movie** **title:** The Matrix **year:** 1999
  
![Screenshot showcasing API fetch results for the movie 'The Matrix'](https://github.com/mjcw88/discord-film-bot/blob/main/slashcommandexample01.png?raw=true)

Using a TMDB ID:

- **/tv** **title:** 4087

![Screenshot showcasing API fetch results for the TV show 'The X-Files'](https://github.com/mjcw88/discord-film-bot/blob/main/slashcommandexample02.png?raw=true)

Using an IMDb ID:

- **/person** **name:** nm0000180

![Screenshot showcasing API fetch results for director 'Sir David Lean'](https://github.com/mjcw88/discord-film-bot/blob/main/slashcommandexample03.png?raw=true)