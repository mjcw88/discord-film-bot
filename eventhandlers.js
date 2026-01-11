const schedule = require("node-schedule");
const { Events } = require("discord.js");

module.exports = (client, REGION, MAX, TIMEOUT, MAX_DIGITS, MESSAGES, deps) => {
    const {
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
    } = deps;

    // Ready event – performs an API check on startup
    client.on("ready", async () => {
        console.log(`${client.user.username} connecting...`);
        try {
            const response = await axios.get("https://api.themoviedb.org/3/authentication", {
                headers: {
                    "accept": "application/json",
                    "Authorization": `Bearer ${process.env.TMDB_API_TOKEN}`
                },
            });
            console.log("API connection successful");
            console.log("TMDB API response:", response.data);
        } catch (error) {
            console.error(`API connection failed: ${error}`);
        }
    });

    // Slash command handler – dispatches based on interaction.commandName
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isCommand()) return;

        try {
            switch (interaction.commandName) {
                case "headshot":
                    await headshot(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "help":
                    await help(interaction, MESSAGES);
                    break;
                case "movie":
                    await movie(interaction, REGION, MAX, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "person":
                    await person(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "poster":
                    await poster(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "recommendations":
                    await recommendations(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "similar":
                    await similar(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "trailer":
                    await trailer(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "tv":
                    await tv(interaction, REGION, MAX, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "tvposter":
                    await tvposter(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "tvrecommendations":
                    await tvrecommendations(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "tvsimilar":
                    await tvsimilar(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
                case "tvtrailer":
                    await tvtrailer(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES);
                    break;
            };

            logCommand(interaction);

        } catch (error) {
            console.error("Error with slash command:", error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: MESSAGES.ERROR });
                } else {
                    await interaction.reply({ content: MESSAGES.ERROR, ephemeral: true });
                }
            } catch (error) {
                console.error("Failed to send error message:", error);
            }
        }
    });
};

function logCommand(interaction) {
    const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });
    
    let options = "";
    interaction.options.data.forEach(o => {
        options += `${o.name}: ${o.value} `;
    });
    
    const message = `used: /${interaction.commandName} ${options.trim()} in the ${interaction.channel.name} channel`;
    console.log(`[${timestamp}] ${interaction.user.username} ${message}`);
};