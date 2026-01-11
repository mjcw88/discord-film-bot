const { EmbedBuilder } = require("discord.js");

// Main async function that generates and displays a help embed
async function help(interaction, MESSAGES) {
    try {
        // Create a Discord embed with the help information
        const embed = new EmbedBuilder()
        .setTitle("\u200B💁 Help")
        .setDescription("Here are the slash commands that you can use. You can search for films/tv shows/people via TMDB (The Movie Database) by using either their title/name/TMDB ID number/IMDb ID number.")
        embed.addFields( { name: "📷 - /headshot", value: "Fetch the person\'s headshot." },
            { name: "💁 - /help", value: "The help command that you just used!" },
            { name: "🎥 - /movie", value: "Fetch the movie's info." },
            { name: "🧑 - /person", value: "Fetch the person\'s info." },
            { name: "🎥 - /poster", value: "Fetch the movie poster." },
            { name: "🎥 - /recommendations", value: "Fetch recommended movie\'s." },
            { name: "🎥 - /similar", value: "Fetch similar movie\'s." },
            { name: "🎥 - /trailer", value: "Fetch the trailer." },
            { name: "📺 - /tv", value: "Fetch the TV show info." },
            { name: "📺 - /tvposter", value: "Fetch the TV show poster." },
            { name: "📺 - /tvrecommendations", value: "Fetch recommended TV show\'s." },
            { name: "📺 - /tvsimilar", value: "Fetch similar TV show\'s." },
            { name: "📺 - /tvtrailer", value: "Fetch the TV show trailer." },
        );
    
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });
        console.error(`[${timestamp}] Error handling ${interaction.commandName} command: ${error}`);
        await interaction.editReply(MESSAGES.ERROR);
    }
};

module.exports = { help };