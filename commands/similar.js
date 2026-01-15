const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

// Main async function that fetches and displays similar movie's
async function similar(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES) {
    const BASE_URL = "https://api.themoviedb.org/3";
    const KEY = process.env.TMDB_API_KEY;
    const MAX_PAGES = 500;

    const input = interaction.options.getString("title");
    const year = interaction.options.getInteger("year");
    let page = interaction.options.getInteger("page");

    try {
        // Defer the reply to prevent the interaction from timing out
        await interaction.deferReply();

        const movieId = await getID(input);

        if (movieId === null) {
            await interaction.editReply(MESSAGES.NO_FILM);
            return;
        }

        if (!page) {
            page = 1;
        }

        const movieURL = `${BASE_URL}/movie/${movieId}?api_key=${KEY}&region=${REGION}`;
        const movieResponse = await axios.get(movieURL, { timeout: TIMEOUT });
        const movieData = movieResponse.data;

        const similarURL = `${BASE_URL}/movie/${movieId}/similar?api_key=${KEY}&region=${REGION}&page=${page}`;
        const similarResponse = await axios.get(similarURL, { timeout: TIMEOUT });
        const similarData = similarResponse.data;

        if (page > similarData.total_pages || page > MAX_PAGES || similarData.results.length === 0) {
            await interaction.editReply(MESSAGES.NO_SIMILAR);
            return;      
        }

        const totalPages = similarData.total_pages > MAX_PAGES ? MAX_PAGES : similarData.total_pages;
        const year = movieData.release_date ? `(${movieData.release_date.substring(0, 4)})` : "";

        // Create a Discord embed with the similar movie information
        const embed = new EmbedBuilder()
            .setTitle(`\u200E\u200B${movieData.title} ${year}`)
            .setThumbnail(`https://image.tmdb.org/t/p/w500${movieData.poster_path}`)
            .setDescription(`\u200E\u200BSimilar films to ${movieData.title}.`)
            .setFooter({ text: `Page ${page} of ${totalPages}`});
        
        similarData.results.forEach(similar => {
            embed.addFields({ name: "", value: getSimilar(similar) });
        })
        
        await interaction.editReply({ embeds: [embed] });      
    } catch (error) {
        if (error.response?.status === 404) {
            await interaction.editReply(MESSAGES.NO_FILM);
        } else if (error.response?.status === 400) {
            await interaction.editReply(MESSAGES.NO_SIMILAR);
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

            if (response.data.movie_results.length > 0) {
                return response.data.movie_results[0].id;
            }
            return null;
        } else {
            let url = `${BASE_URL}/search/movie?api_key=${KEY}&region=${REGION}&query=${encodeURIComponent(input)}`;

            if (year) {
                url += `&primary_release_year=${year}`;
            }

            let response = await axios.get(url, { timeout: TIMEOUT });

            if (response.data.results.length > 0) {
                return response.data.results[0].id;
            } else if (year) {
                url = `${BASE_URL}/search/movie?api_key=${KEY}&region=${REGION}&query=${encodeURIComponent(input)}&year=${year}`

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

    function getSimilar(movie) {
        const year = movie.release_date ? `(${movie.release_date.substring(0, 4)})` : "";
        return `\u200E\u200B[${movie.title} ${year}](https://www.themoviedb.org/movie/${movie.id})`;
    };
};

module.exports = { similar };