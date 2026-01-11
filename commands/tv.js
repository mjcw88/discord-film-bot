const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

// Main async function that fetches and displays a TV show's info
async function tv(interaction, REGION, MAX, TIMEOUT, MAX_DIGITS, MESSAGES) {
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

        const url = `${BASE_URL}/tv/${tvId}?api_key=${KEY}&region=${REGION}&append_to_response=credits,content_ratings,external_ids`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        const tvData = response.data;
        const creditsData = response.data.credits;
        const contentRatingsData = response.data.content_ratings.results;
        const externalIdData = response.data.external_ids;

        const countryEmbedTitle = tvData.production_countries.length > 1 ? "Countries" : "Country";
        const languageEmbedTitle = tvData.spoken_languages.length > 1 ? "Languages" : "Language";
        const classificationEmbedTitle = contentRatingsData.length > 1 ? "Classifications" : "Classification";
        const genreEmbedTitle = tvData.genres.length > 1 ? "Genres" : "Genre";
        
        // Create a Discord embed with the TV Show's information
        const embed = new EmbedBuilder()
            .setTitle(`\u200E\u200B${tvData.name}`)
            .setDescription(`\u200E\u200B${tvData.overview || "Plot synopsis unavailable."}`)
            .setThumbnail(`https://image.tmdb.org/t/p/original${tvData.poster_path}`)
        
        if (tvData.tagline) {
            embed.addFields({ name: '🏷️ - Tagline', value: `\u200E\u200B${tvData.tagline}` });
        }
        if (tvData.vote_average > 0) {
            embed.addFields({ name: '⭐ - Rating', value: getRating(tvData.vote_count, tvData.vote_average) });
        }

        embed.addFields({ name: '🧑‍🎨 - Created by', value: `\u200E\u200B${getCreator(tvData.created_by)}`, inline: true },
            { name: '👥 - Starring', value: `\u200E\u200B${getCast(creditsData.cast)}`, inline: true },
            { name: '🎥 - Type', value: getType(tvData.type), inline: true },
            { name: '📺 - Seasons', value: getSeasons(tvData.number_of_seasons), inline: true },
            { name: '📼 - Episodes', value: getEpisodes(tvData.number_of_episodes), inline: true },
            { name: '🎞️ - Runtime', value: getRuntime(tvData.episode_run_time), inline: true },
            { name: `🗺️ - ${countryEmbedTitle}`, value: getProductionCountries(tvData.production_countries), inline: true },
            { name: `💬 - ${languageEmbedTitle}`, value: getLanguages(tvData.spoken_languages), inline: true },
            { name: `🧾 - ${classificationEmbedTitle}`, value: getClassifications(contentRatingsData), inline: true },
            { name: `🎭 - ${genreEmbedTitle}`, value: getGenres(tvData.genres), inline: true },
            { name: '📆 - Original Run', value: getOriginalRun(tvData.first_air_date, tvData.last_air_date, tvData.status), inline: true },
            { name: '✅ - Status', value: getStatus(tvData.status), inline: true },
            { name: "🔗 - Links", value: getLinks(tvId, externalIdData.imdb_id, tvData.homepage) },
        );

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

    function getRating(count, average) {
        const votes = count === 1 ? "vote" : "votes";
        return `**${average.toFixed(1)}** (${count.toLocaleString()} ${votes})`;
    };

    function getCreator(creators) {
        return creators.map(c => c.name).slice(0, MAX).join('\n') || MESSAGES.NONE;
    };

    function getCast(cast) {
        return cast.map(c => c.name).slice(0, MAX).join('\n') || MESSAGES.NONE;
    };

    function getType(type) {
        return type ?? MESSAGES.NONE;
    };

    function getSeasons(seasons) {
        return seasons > 0 ? seasons.toLocaleString() : MESSAGES.NONE;
    };

    function getEpisodes(episodes) {
        return episodes > 0 ? episodes.toLocaleString() : MESSAGES.NONE;
    };

    function getRuntime(runtime) {
        const minutes = runtime[0] === 1 ? "minute" : "minutes";
        return runtime[0] > 0 ? `${runtime[0]} ${minutes}` : MESSAGES.NONE;
    };

    function getProductionCountries(countries) {                       
        return countries.length > 0 ? formatCountryName(countries, MAX) : MESSAGES.NONE;
    };

    function formatCountryName(countries, max) {
        return countries
            .map(country => {
                if (country.name === "United States of America") {
                    return "United States";
                }
                return country.name;
            })
            .slice(0, max)
            .join("\n");
    };

    function getLanguages(languages) {
        return languages.length > 0 ? languages.map(sl => sl.english_name).slice(0, MAX).join('\n') : MESSAGES.NONE;
    };

    function getClassifications(ratings) {
        return ratings.length > 0 ? ratings.map(r => `${r.rating} (${r.iso_3166_1})`).slice(0, MAX).join('\n') : MESSAGES.NONE;
    };

    function getGenres(genres) {
        return genres.length > 0 ? genres.map(g => g.name).slice(0, MAX).join(`\n`) : MESSAGES.NONE;
    };

    function getOriginalRun(first, last, status) {
        if (first) {
            const date = new Date(first);
            const day = date.getDate();
            const month = date.toLocaleString("en-GB", { month: "short" });
            const year = date.getFullYear();
            const firstDate = `${day} ${month} ${year}`;

            let lastDate = "";
            if (status.trim().toLowerCase() === 'returning series') {
                lastDate = "Present";
            } else if (last) {
                const date = new Date(last);
                const day = date.getDate();
                const month = date.toLocaleString("en-GB", { month: "short" });
                const year = date.getFullYear();
                lastDate = `${day} ${month} ${year}`;
            } else {
                lastDate = "?";
            }
            return `${firstDate} - ${lastDate}`;
        }
        return MESSAGES.NONE;
    };

    function getStatus(status) {
        return status ?? MESSAGES.NONE;
    };

    function getLinks(id, imdb, homepage) {
        const tmdbLink = `[TMDB](https://www.themoviedb.org/tv/${id})`;
        const imdbLink = imdb ? `| [IMDb](https://www.imdb.com/title/${imdb})` : "";
        const homepageLink = homepage ? `| [Official Website](${homepage})` : "";
        return `${tmdbLink} ${imdbLink} ${homepageLink}`;
    };
};

module.exports = { tv };