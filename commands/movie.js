const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

// Main async function that fetches and displays a movie's info
async function movie(interaction, REGION, MAX, TIMEOUT, MAX_DIGITS, MESSAGES) {
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

        const url = `${BASE_URL}/movie/${movieId}?api_key=${KEY}&region=${REGION}&append_to_response=credits,release_dates`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        const movieData = response.data;
        const creditsData = response.data.credits;
        const releaseDatesData = response.data.release_dates;

        const countryEmbedTitle = movieData.production_countries.length > 1 ? "Countries" : "Country";
        const languageEmbedTitle = movieData.spoken_languages.length > 1 ? "Languages" : "Language";
        const classifications = getClassification(releaseDatesData);
        const classificationEmbedTitle = classifications.count > 1 ? "Classifications" : "Classification";
        const genreEmbedTitle = movieData.genres.length > 1 ? "Genres" : "Genre";

        // Create a Discord embed with the movie's information
        const embed = new EmbedBuilder()
            .setTitle(`\u200E\u200B${movieData.title}`)
            .setThumbnail(`https://image.tmdb.org/t/p/original${movieData.poster_path}`)
            .setDescription(`\u200E\u200B${movieData.overview || "Plot synopsis unavailable."}`)

        if (movieData.tagline) {
            embed.addFields({ name: "🏷️ - Tagline", value: `\u200E\u200B${movieData.tagline}` });
        }
        if (movieData.vote_average > 0) {
            embed.addFields({ name: "⭐ - Rating", value: getRating(movieData.vote_count, movieData.vote_average) });
        }

        embed.addFields({ name: "🎬 - Directed by", value: `\u200E\u200B${getDirectors(creditsData.crew)}`, inline: true },
            { name: "✍️ - Written by", value: `\u200E\u200B${getWriters(creditsData.crew)}`, inline: true },
            { name: "⚙️ - Produced by", value: `\u200E\u200B${getProducers(creditsData.crew)}`, inline: true },
            { name: "👥 - Starring", value: `\u200E\u200B${getCast(creditsData.cast)}`, inline: true },
            { name: "📆 - Release Date", value: getReleaseDate(movieData.release_date), inline: true },
            { name: "🎞️ - Runtime", value: getRunTime(movieData.runtime), inline: true },
            { name: `🗺️ - ${countryEmbedTitle}`, value: getProductionCountries(movieData.production_countries), inline: true },
            { name: `💬 - ${languageEmbedTitle}`, value: getLanguages(movieData.spoken_languages), inline: true },
            { name: `🧾 - ${classificationEmbedTitle}`, value: classifications.text, inline: true },
            { name: `🎭 - ${genreEmbedTitle}`, value: getGenres(movieData.genres), inline: true },
            { name: "💰 - Budget", value: getBudget(movieData.budget), inline: true },
            { name: "🤑 - Box Office", value: getRevenue(movieData.revenue), inline: true },
            { name: "🔗 - Links", value: getLinks(movieId, movieData.imdb_id, movieData.homepage) },
        );

        await interaction.editReply({ embeds: [embed] });           
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

    function getRating(count, average) {
        const votes = count === 1 ? "vote" : "votes";
        return `**${average.toFixed(1)}** (${count.toLocaleString()} ${votes})`;
    };

    function getDirectors(crew) {
        const directors = [];

        crew.forEach(member => {
            if (member.job === "Director" && directors.length < MAX) {
                directors.push(member.name);
            }
        });
        return directors.length > 0 ? directors.join("\n") : MESSAGES.NONE;
    };

    function getWriters(crew) {
        const writersTitles = ["Writer", "Screenplay", "Story", "Teleplay"];
        const writers = [];

        crew.forEach(member => {
            if (writersTitles.includes(member.job) && 
                !writers.includes(member.name) && 
                writers.length < MAX) {
                writers.push(member.name);
            }
        });
        return writers.length > 0 ? writers.join("\n") : MESSAGES.NONE;
    };

    function getProducers(crew) {
        const producerTitles = ["Executive Producer", "Associate Producer", "Co-Producer"];
        const producers = [];

        // First, try to find members with "Producer" job title
        crew.forEach(member => {
            if (member.job === "Producer" && 
                !producers.includes(member.name) &&
                producers.length < MAX) {
                producers.push(member.name);
            }
        });

        // If no producers found, fall back to alternative producer titles
        if (producers.length === 0) {
            crew.forEach(member => {
                if (producerTitles.includes(member.job) &&
                !producers.includes(member.name) &&
                producers.length < MAX) {
                producers.push(member.name);
                }
            });
        }
        return producers.length > 0 ? producers.join("\n") : MESSAGES.NONE;
    };

    function getCast(cast) {
        return cast.map(c => c.name).slice(0, MAX).join('\n') || MESSAGES.NONE;
    };

    function getReleaseDate(releaseDate) {
        if (releaseDate) {
            const date = new Date(releaseDate);
            const day = date.getDate();
            const month = date.toLocaleString("en-GB", { month: "short" });
            const year = date.getFullYear();
            return `${day} ${month} ${year}`;
        }
        return MESSAGES.NONE;
    };

    function getRunTime(runtime) {
        const minutes = runtime === 1 ? "minute" : "minutes";
        return runtime > 0 ? `${runtime} ${minutes}` : MESSAGES.NONE;
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
        return languages.length > 0 ? languages.map(sl => sl.english_name).slice(0, MAX).join("\n") : MESSAGES.NONE;
    };

    function getClassification(releaseDates) {
        const allClassifications = [];
        
        // Loop through all countries' release dates
        releaseDates.results.forEach(country => {            
            // Find the earliest release date with a certification for this country
            const earliest = country.release_dates.reduce((earliest, release) => {
                // Skip releases without certification
                if (!release.certification) return earliest;
                // If no earliest found yet, use this one
                if (!earliest) return release;
                
                // Compare dates and keep the earliest one
                return new Date(release.release_date) < new Date(earliest.release_date) 
                    ? release 
                    : earliest;
            }, null);
            
            // If an earliest release with certification was found, add it to the list
            if (earliest) {
                allClassifications.push({
                    certification: earliest.certification,
                    country: country.iso_3166_1,
                    release_date: earliest.release_date,
                });
            }
        });
        
        // Sort classifications by release date (earliest first) and limit to MAX
        const classifications = allClassifications
            .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
            .slice(0, MAX);
    
        return {
            text: classifications.length > 0 ? classifications.map(c => `${c.certification} (${c.country})`).join("\n") : MESSAGES.NONE,
            count: classifications.length,
        }
    };

    function getGenres(genres) {
        return genres.length > 0 ? genres.map(g => g.name).slice(0, MAX).join("\n") : MESSAGES.NONE;
    };

    function getBudget(budget) {
        return budget > 0 ? `$${budget.toLocaleString()}` : MESSAGES.NONE;
    };

    function getRevenue(revenue) {
        return revenue > 0 ? `$${revenue.toLocaleString()}` : MESSAGES.NONE;
    };

    function getLinks(id, imdb, homepage) {
        const tmdbLink = `[TMDB](https://www.themoviedb.org/movie/${id})`;
        const imdbLink = imdb ? `| [IMDb](https://www.imdb.com/title/${imdb})` : "";
        const homepageLink = homepage ? `| [Official Website](${homepage})` : "";
        return `${tmdbLink} ${imdbLink} ${homepageLink}`;
    };
};

module.exports = { movie };