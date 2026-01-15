const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

// Main async function that fetches and displays a TV show's poster
async function tvposter(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES) {
    const BASE_URL = "https://api.themoviedb.org/3";
    const KEY = process.env.TMDB_API_KEY;

    const input = interaction.options.getString("title");
    const year = interaction.options.getInteger("year");

    try {
        // Defer the reply to prevent the interaction from timing out
        await interaction.deferReply();

        const tvId = await getID(input);

        if (tvId === null) {
            await interaction.editReply(MESSAGES.NO_TV);
            return;
        }

        const url = `${BASE_URL}/tv/${tvId}?api_key=${KEY}&region=${REGION}`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        const tvData = response.data;

        // Create a Discord embed with the TV Show poster
        const embed = new EmbedBuilder()
            .setTitle(`\u200E\u200B${tvData.name} ${getOriginalRun(tvData.first_air_date, tvData.last_air_date, tvData.status)}`)
            .setImage(`https://image.tmdb.org/t/p/w500${tvData.poster_path}`)

        await interaction.editReply({ embeds: [embed] });     
    } catch (error) {
        if (error.response?.status === 404) {
            await interaction.editReply(MESSAGES.NO_TV);
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

            if (response.data.tv_results.length > 0) {
                return response.data.tv_results[0].id;
            }
            return null;
        } else {
            let url = `${BASE_URL}/search/tv?api_key=${KEY}&region=${REGION}&query=${encodeURIComponent(input)}`;

            if (year) {
                url += `&first_air_date_year=${year}`;
            }

            let response = await axios.get(url, { timeout: TIMEOUT });

            if (response.data.results.length > 0) {
                return response.data.results[0].id;
            } else if (year) {
                url = `${BASE_URL}/search/tv?api_key=${KEY}&region=${REGION}&query=${encodeURIComponent(input)}&year=${year}`

                response = await axios.get(url, { timeout: TIMEOUT });

                if (response.data.results.length > 0) {
                    return response.data.results[0].id;
                }
                return null;
            }
            return null;
        }
    };

    function isImdbInput(input) {
        const IMDB = /^tt\d+$/;
        return IMDB.test(input);
    };

    function getOriginalRun(first, last, status) {
        if (first) {
            const date = new Date(first);
            const firstDate = date.getFullYear();

            let lastDate = "";
            if (status.trim().toLowerCase() === 'returning series') {
                lastDate = "";
            } else if (last) {
                const date = new Date(last);
                lastDate = date.getFullYear();
            } else {
                lastDate = "?";
            }
            return `(${firstDate} - ${lastDate})`;
        }
        return "";
    };
};

module.exports = { tvposter };
