const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

// Main async function that fetches and displays a person's headshot from TMDB
async function headshot(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES) {
    const BASE_URL = "https://api.themoviedb.org/3";
    const KEY = process.env.TMDB_API_KEY;
    const input = interaction.options.getString("name");
    
    try {
        // Defer the reply to prevent the interaction from timing out
        await interaction.deferReply();
            
        const personId = await getID(input);

        if (personId === null) {
            await interaction.editReply(MESSAGES.NO_PERSON);
            return;
        }
        
        const url = `${BASE_URL}/person/${personId}?api_key=${KEY}&region=${REGION}`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        const personData = response.data;
        
        // Create a Discord embed with the person's information
        const embed = new EmbedBuilder()
            .setTitle(`\u200E\u200B${personData.name}`)
            .setImage(`https://image.tmdb.org/t/p/w500${personData.profile_path}`)
        
        await interaction.editReply({ embeds: [embed] });     
    } catch (error) {
        if (error.response?.status === 404) {
            await interaction.editReply(MESSAGES.NO_PERSON);
        } else {
            const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });
            console.error(`[${timestamp}] Error handling ${interaction.commandName} command: ${error}`);
            await interaction.editReply(MESSAGES.ERROR);
        }
    }
    
    async function getID(input) {
        if (!isNaN(input)) {
            if (input.length > MAX_DIGITS) {
                return null;
            }
            return input;
        } else if (isImdbInput(input)) {
            const url = `${BASE_URL}/find/${input}?api_key=${KEY}&region=${REGION}&external_source=imdb_id`;
            const response = await axios.get(url, { timeout: TIMEOUT });

            if (response.data.person_results.length > 0) {
                return response.data.person_results[0].id;
            }
            return null;
        } else {
            const url = `${BASE_URL}/search/person?api_key=${KEY}&region=${REGION}&query=${encodeURIComponent(input)}`;
            const response = await axios.get(url, { timeout: TIMEOUT });

            if (response.data.results.length > 0) {
                return response.data.results[0].id;
            }
            return null;
        }
    };
    
    function isImdbInput(input) {
        const IMDB = /^nm\d+$/;
        return IMDB.test(input);
    };
};

module.exports = { headshot };