require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require ("discord.js");

const commands = [
    {
        name: "headshot",
        description: "Fetch the person\'s headshot.",
        options: [
            {
                name: "name",
                description: "Please provide either the name or ID of the person.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    {
        name: "help",
        description: "Explains the list of commands.",
    },
    {
        name: "movie",
        description: "Fetch the movie.",
        options: [
            {
                name: "title",
                description: "Please provide either the title or ID of the movie.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the movie.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
    {
        name: "person",
        description: "Fetch the person\'s info.",
        options: [
            {
                name: "name",
                description: "Please provide either the name or ID of the person.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    {
        name: "poster",
        description: "Fetch the movie poster.",
        options: [
            {
                name: "title",
                description: "Please provide either the title or ID of the movie.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the movie.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
    {
        name: "recommendations",
        description: "Fetch recommended movies.",
        options: [
            {
                name: "title",
                description: "Please provide either the title or ID of the movie.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the movie.",
                type: ApplicationCommandOptionType.Integer,
            },
            {
                name: "page",
                description: "Please provide page number.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
    {
        name: "similar",
        description: "Fetch similar movie.",
        options: [
            {
                name: "title",
                description: "Please provide either the title or ID of the movie.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the movie.",
                type: ApplicationCommandOptionType.Integer,
            },
            {
                name: "page",
                description: "Please provide page number.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
    {
        name: "trailer",
        description: "Fetch the trailer.",
        options: [
            {
                name: "title",
                description: "Please provide either the title or ID of the movie.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the movie.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
    {
        name: "tv",
        description: "Fetch the TV show.",
        options: [
            {
                name: "title",
                description: "Please provide either the name or ID of the TV show.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the TV show.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
    {
        name: "tvposter",
        description: "Fetch the TV show poster.",
        options: [
            {
                name: "title",
                description: "Please provide either the name or ID of the TV show.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the TV show.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
        {
        name: "tvrecommendations",
        description: "Fetch recommended TV shows.",
        options: [
            {
                name: "title",
                description: "Please provide either the title or ID of the TV show.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the TV show.",
                type: ApplicationCommandOptionType.Integer,
            },
            {
                name: "page",
                description: "Please provide page number.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
    {
        name: "tvsimilar",
        description: "Fetch similar movies.",
        options: [
            {
                name: "title",
                description: "Please provide either the title or ID of the TV show.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the TV show.",
                type: ApplicationCommandOptionType.Integer,
            },
            {
                name: "page",
                description: "Please provide page number.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
    {
        name: "tvtrailer",
        description: "Fetch the TV show trailer.",
        options: [
            {
                name: "title",
                description: "Please provide either the name or ID of the TV show.",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "year",
                description: "Please provide the release year of the TV show.",
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log("Slash commands were registered successfully!");
    } catch (error) {
        console.log(`Error!: ${error}`);
    }
})();