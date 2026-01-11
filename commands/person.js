const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

// Main async function that fetches and displays a person's info
async function person(interaction, REGION, TIMEOUT, MAX_DIGITS, MESSAGES) {
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

        const url = `${BASE_URL}/person/${personId}?api_key=${KEY}&region=${REGION}&append_to_response=combined_credits`
        const response = await axios.get(url, { timeout: TIMEOUT });
        const personData = response.data;
        const creditsData = response.data.combined_credits;

        // Create a Discord embed with the person's information
        const embed = new EmbedBuilder()
            .setTitle(`\u200E\u200B${personData.name}`)
            .setThumbnail(`https://image.tmdb.org/t/p/w500${personData.profile_path}`)
            .setDescription(`\u200E\u200B${personData.biography || "Biography unavailable."}`)
        
        embed.addFields({ name: "🔎 - Known For", value: getKnownFor(personData.known_for_department), inline: true },
            { name: "🔎 - Known Credits", value: getCredits(creditsData), inline: true },
            { name: "🗺️ - Place of Birth", value: `\u200E\u200B${getBirthPlace(personData.place_of_birth)}` },
            { name: "🎂 - Date of Birth", value: getBirthDay(personData.birthday, personData.deathday) },
        );

        if (personData.deathday) {
            embed.addFields({ name: "☠️ - Date of Death", value: getDeathDay(personData.birthday, personData.deathday) });
        }

        embed.addFields({ name: '🔗 - Links', value: getLinks(personId, personData.imdb_id, personData.homepage) });

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
        } else if (isImdbinput(input)) {
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

    function isImdbinput(input) {
        const IMDB = /^nm\d+$/;
        return IMDB.test(input);
    };

    function getKnownFor(knownFor) {
        return knownFor ?? MESSAGES.NONE;
    };

    function getCredits(credits) {
        const uniqueCredits = new Set();

        credits.cast.forEach(credit => { uniqueCredits.add(credit.id) });
        credits.crew.forEach(credit => { uniqueCredits.add(credit.id) });
        return uniqueCredits.size.toLocaleString() ?? MESSAGES.NONE;
    };

    function getBirthPlace(birthPlace) {
        return birthPlace ?? MESSAGES.NONE;
    };

    function getBirthDay(birthday, deathday) {
        return deathday ? formatDateWithoutAge(birthday) || MESSAGES.NONE : birthday ? formatDateWithAge(birthday) : MESSAGES.NONE;
    };

    function getDeathDay(birthday, deathday) {
        const ageAtDeath = calculateAgeAtDeath(new Date(birthday), new Date(deathday));
        const year = ageAtDeath === 1 ? "year" : "years";
        const age = `\n(${ageAtDeath} ${year} old)`;
        return `${formatDateWithoutAge(deathday)} ${age}`;
    };

    function calculateAgeAtDeath(birthDate, deathDate) {
        const age = deathDate.getFullYear() - birthDate.getFullYear();
        const birthMonth = birthDate.getMonth();
        const deathMonth = deathDate.getMonth();

        // Adjust age if death occurred before the birthday that year
        if (deathMonth < birthMonth || (deathMonth === birthMonth && deathDate.getDate() < birthDate.getDate())) {
            return age - 1;
        }
        return age;
    };

    function formatDateWithoutAge(rawDate) {
        const date = new Date(rawDate);
        const day = date.getDate();
        const month = date.toLocaleString("en-GB", { month: "short" });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    function formatDateWithAge(rawDate) {
        const date = new Date(rawDate);
        const day = date.getDate();
        const month = date.toLocaleString("en-GB", { month: "short" });
        const year = date.getFullYear();
        const age = calculateAge(date);
        return `${day} ${month} ${year} \n (${age} years old)`;
    };

    function calculateAge(birthDate) {
        const currentDate = new Date();
        const birthYear = birthDate.getFullYear();
        const currentYear = currentDate.getFullYear();
        const age = currentYear - birthYear;

        // Adjust age if birthday hasn't occurred yet this year
        if (currentDate.getMonth() < birthDate.getMonth() || (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate())) {
            return age - 1;
        }
        return age;
    };

    function getLinks(id, imdb, homepage) {
        const tmdbLink = `[TMDB](https://www.themoviedb.org/person/${id})`;
        const imdbLink = imdb ? `| [IMDb](https://www.imdb.com/name/${imdb})` : "";
        const homepageLink = homepage ? `| [Official Website](${homepage})` : "";
        return `${tmdbLink} ${imdbLink} ${homepageLink}`;
    };
};

module.exports = { person };