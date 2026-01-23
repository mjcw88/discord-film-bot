const axios = require("axios");

// Main async function that fetches and displays a TV show's trailer
async function tvtrailer(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES) {
    const BASE_URL = "https://api.themoviedb.org/3";
    const KEY = process.env.TMDB_API_KEY;

    const input = interaction.options.getString("title");
    const year = interaction.options.getInteger("year");

    const languagesArray = ["en","fr","es","de","ja"]

    try {
        // Defer the reply to prevent the interaction from timing out
        await interaction.deferReply();

        const tvId = await getID(input);

        if (tvId === null) {
            await interaction.editReply(MESSAGES.NO_TV);
            return;
        }

        const detailsUrl = `${BASE_URL}/tv/${tvId}?api_key=${KEY}`;
        const detailsResponse = await axios.get(detailsUrl, { timeout: TIMEOUT });
        const originalLanguage = detailsResponse.data.original_language;

        const languages = languagesArray.includes(originalLanguage)
            ? languagesArray.join(",")
            : [...languagesArray.slice(0, -1), originalLanguage].join(",");

        const url = `${BASE_URL}/tv/${tvId}/videos?api_key=${KEY}&region=${REGION}&include_video_language=${languages}`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        const videoData = response.data.results;

        if (videoData.length === 0) {
            await interaction.editReply(MESSAGES.NO_TRAILER);
            return;
        }
        
        await interaction.editReply(getTrailer(videoData, originalLanguage));
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

    function getTrailer(videos, originalLanguage) {
        const videoTypes = ["teaser", "clip", "opening credits", "featurette", "behind the scenes", "bloopers"];

        let trailer = findBestTrailerInLanguage(videos, "en");
        
        if (!trailer && originalLanguage !== "en") {
            trailer = findBestTrailerInLanguage(videos, originalLanguage);
        }
        
        if (!trailer) {
            const allTrailers = videos.filter(v => v.type.toLowerCase() === "trailer");
            trailer = selectBestTrailer(allTrailers);
        }
        
        // If a trailer was found, get its link
        if (trailer) {
            return `trailer: ${getLinkType(trailer)}`;    
        } else {
            // If no trailer found, search for other video types in order of preference
            for (const type of videoTypes) {
                const video = videos.find(video => video.type.toLowerCase() === type.toLowerCase());
                if (video) {
                    return `${type}: ${getLinkType(video)}`;    
                }
            }
        }
    }

    function selectBestTrailer(trailerVideos) {
        let trailer = null;
        let fallbackOfficial = null;
        let fallbackAny = null;
        
        for (const video of trailerVideos) {
            const hasTrailerName = video.name.toLowerCase().includes("trailer");
            const isOfficial = video.official === true;
            
            // Best case: has "trailer" in name AND is official
            if (hasTrailerName && isOfficial) {
                trailer = video;
                break;
            }
            // Second best: official trailer
            if (!fallbackOfficial && isOfficial) fallbackOfficial = video;
            // Third best: any trailer
            if (!fallbackAny) fallbackAny = video;
        }
        
        return trailer || fallbackOfficial || fallbackAny;
    }

    function findBestTrailerInLanguage(videos, language) {
        const languageVideos = videos.filter(v => 
            v.iso_639_1 === language && v.type.toLowerCase() === "trailer"
        );
        return selectBestTrailer(languageVideos);
    }

    function getLinkType(video) {
        if (video.site === "YouTube") {
            return `https://www.youtube.com/watch?v=${video.key}`;
        }
        return `https://www.vimeo.com/${video.key}`;
    }
};

module.exports = { tvtrailer };
