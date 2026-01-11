const axios = require("axios");

// Main async function that fetches and posts a movie's trailer
async function trailer(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES) {
    const BASE_URL = "https://api.themoviedb.org/3";
    const KEY = process.env.TMDB_API_KEY;

    const input = interaction.options.getString("title");
    const year = interaction.options.getInteger("year");

    try {
        // Defer the reply to prevent the interaction from timing out
        await interaction.deferReply();

        const movieId = await getID(input);

        if (movieId === null) {
            await interaction.editReply(MESSAGES.NO_FILM);
            return;
        }

        const url = `${BASE_URL}/movie/${movieId}/videos?api_key=${KEY}&region=${REGION}`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        const videoData = response.data.results;

        if (videoData.length === 0) {
            await interaction.editReply(MESSAGES.NO_TRAILER);
            return;
        }
        
        await interaction.editReply(getTrailer(videoData));
    } catch (error) {
        if (error.response?.status === 404) {
            await interaction.editReply(MESSAGES.NO_FILM);
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

    function getTrailer(videos) {
        const videoTypes = ["teaser", "clip", "featurette", "behind the scenes", "bloopers"];

        let trailer = null;
        let fallbackOfficial = null;
        let fallbackAny = null;
        
        // Loop through all videos to find the best trailer
        for (const video of videos) {
            if (video.type.toLowerCase() !== "trailer") continue;
            
            const hasTrailerName = video.name.toLowerCase().includes("trailer");
            const isOfficial = video.official === true;
            
            // Best case: video is "trailer" video type AND has "trailer" in name AND is official
            if (hasTrailerName && isOfficial) {
                trailer = video;
                break;
            }
            // Second best: store first official trailer found (even without "trailer" in name)
            if (!fallbackOfficial && isOfficial) fallbackOfficial = video;
            // Third best: store any trailer found
            if (!fallbackAny) fallbackAny = video;
        }
        
        trailer = trailer || fallbackOfficial || fallbackAny;
        
        // If a trailer was found, get its link
        if (trailer) {
            return getLinkType(trailer);    
        } else {
            // If no trailer found, search for other video types in order of preference
            for (const type of videoTypes) {
                const video = videos.find(video => video.type.toLowerCase() === type.toLowerCase());
                if (video) {
                    return getLinkType(video);  
                }
            }
        }
    };

    function getLinkType(video) {
        if (video.site === "YouTube") {
            return `https://www.youtube.com/watch?v=${video.key}`;
        }
        return `https://www.vimeo.com/${video.key}`;
    };
};

module.exports = { trailer };
