require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const axios = require("axios");

const { headshot } = require("./commands/headshot");
const { help } = require("./commands/help");
const { movie } = require("./commands/movie");
const { person } = require("./commands/person");
const { poster } = require("./commands/poster");
const { recommendations } = require("./commands/recommendations");
const { similar } = require("./commands/similar");
const { trailer } = require("./commands/trailer");
const { tv } = require("./commands/tv");
const { tvposter } = require("./commands/tvposter");
const { tvrecommendations } = require("./commands/tvrecommendations");
const { tvsimilar } = require("./commands/tvsimilar");
const { tvtrailer } = require("./commands/tvtrailer");

const registerEventHandlers = require("./eventhandlers");

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildPresences,
    ],
});

// Global variables used in commands
REGION = "GB";
MAX = 3;
TIMEOUT = 10000;
MAX_DIGITS = 15;

const MESSAGES = {
    NO_FILM: "Film not found!",
    NO_TV: "TV show not found!",
    NO_PERSON: "Person not found!",
    NO_TRAILER: "Trailer not found!",
    NO_RECOMMENDATIONS: "Recommendations not found!",
    NO_SIMILAR: "Similar films not found",
    NO_TV_SIMILAR: "Similar TV shows not found!",
    ERROR: "Error!",
    NONE: "-",
};

// Pass dependencies to the event handlers
registerEventHandlers(client, REGION, MAX, TIMEOUT, MAX_DIGITS, MESSAGES, {
    headshot,
    help,
    movie,
    person,
    poster,
    recommendations,
    similar,
    trailer,
    tv,
    tvposter,
    tvrecommendations,
    tvsimilar,
    tvtrailer,
    axios,
});

client.login(process.env.TOKEN);