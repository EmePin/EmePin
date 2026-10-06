const fs = require("fs");

const API_KEY = process.env.REEF_API_KEY;

const INSTAGRAM_API_URL =
    "https://api.reefapi.com/instagram/v1/posts";

const WEATHER_API_URL =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=19.4326" +
    "&longitude=-99.1332" +
    "&current_weather=true" +
    "&daily=sunrise,sunset" +
    "&timezone=America/Mexico_City";


// ─────────────────────────────────────────────
// INSTAGRAM
// ─────────────────────────────────────────────

async function getPosts() {

    const response = await fetch(INSTAGRAM_API_URL, {
        method: "POST",

        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            username: "visitmexico",
            limit: 3
        })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
        throw new Error(
            `ReefAPI error: ${JSON.stringify(result)}`
        );
    }

    return result.data.posts;
}


// ─────────────────────────────────────────────
// WEATHER
// ─────────────────────────────────────────────

async function getWeather() {

    const response =
        await fetch(WEATHER_API_URL);

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            `Open-Meteo error: ${JSON.stringify(data)}`
        );
    }

    return data;
}


// ─────────────────────────────────────────────
// WEATHER DESCRIPTION
// ─────────────────────────────────────────────

function getWeatherDescription(code) {

    const descriptions = {

        0: "clear sky",

        1: "mainly clear",
        2: "partly cloudy",
        3: "overcast",

        45: "fog",
        48: "depositing rime fog",

        51: "light drizzle",
        53: "moderate drizzle",
        55: "dense drizzle",

        56: "light freezing drizzle",
        57: "dense freezing drizzle",

        61: "slight rain",
        63: "moderate rain",
        65: "heavy rain",

        66: "light freezing rain",
        67: "heavy freezing rain",

        71: "slight snow",
        73: "moderate snow",
        75: "heavy snow",

        77: "snow grains",

        80: "slight rain showers",
        81: "moderate rain showers",
        82: "violent rain showers",

        85: "slight snow showers",
        86: "heavy snow showers",

        95: "thunderstorm",

        96: "thunderstorm with slight hail",
        99: "thunderstorm with heavy hail"
    };

    return descriptions[code] || "unknown weather";
}


// ─────────────────────────────────────────────
// MEXICO TIME
// ─────────────────────────────────────────────

function getMexicoTime() {

    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Mexico_City"
    }).format(new Date());
}


// ─────────────────────────────────────────────
// LAST UPDATED
// UTC +0 AND MEXICO UTC-6
// ─────────────────────────────────────────────

function getLastUpdated() {

    const now = new Date();

    const utc = new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeStyle: "short",
        hour12: false,
        timeZone: "UTC"
    }).format(now);

    const mexico = new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeStyle: "short",
        hour12: false,
        timeZone: "America/Mexico_City"
    }).format(now);

    return {
        utc,
        mexico
    };
}


// ─────────────────────────────────────────────
// FORMAT SUN TIME
// ─────────────────────────────────────────────

function formatTime(dateTime) {
    return dateTime.slice(11, 16);
}


// ─────────────────────────────────────────────
// INSTAGRAM HTML
// ─────────────────────────────────────────────

function generatePosts(posts) {

    return posts
        .slice(0, 3)
        .map(post => {

            const url =
                `https://www.instagram.com/p/${post.shortcode}/`;

            return `<a href="${url}">
  <img
    src="${post.display_url}"
    width="250"
    alt="@VisitMexico Instagram post"
  />
</a>`;
        })
        .join("\n");
}


// ─────────────────────────────────────────────
// UPDATE README
// ─────────────────────────────────────────────

function updateReadme(posts, weather) {

    const path = "README.md";

    const readme =
        fs.readFileSync(path, "utf8");

    const start =
        "<!-- VISITMEXICO:START -->";

    const end =
        "<!-- VISITMEXICO:END -->";

    const startIndex =
        readme.indexOf(start);

    const endIndex =
        readme.indexOf(end);

    if (
        startIndex === -1 ||
        endIndex === -1
    ) {
        throw new Error(
            "VISITMEXICO markers not found."
        );
    }


    // ─────────────────────────────────────────
    // WEATHER DATA
    // ─────────────────────────────────────────

    const currentWeather =
        weather.current_weather;

    const temperature =
        Math.round(currentWeather.temperature);

    const weatherDescription =
        getWeatherDescription(
            currentWeather.weathercode
        );

    const sunrise =
        formatTime(
            weather.daily.sunrise[0]
        );

    const sunset =
        formatTime(
            weather.daily.sunset[0]
        );


    // ─────────────────────────────────────────
    // LAST UPDATED
    // ─────────────────────────────────────────

    const lastUpdated =
        getLastUpdated();


    // ─────────────────────────────────────────
    // README CONTENT
    // ─────────────────────────────────────────

    const content = `

<p align="center">

${generatePosts(posts)}

</p>

<p align="center">

Currently, the weather is: **${temperature}°C, *${weatherDescription}***

Today, the sun rises at **${sunrise}** and sets at **${sunset}**.

</p>

<p align="center">

  <sub>
    Last updated: ${lastUpdated.utc} (UTC+0) ·
    ${lastUpdated.mexico} (Mexico, UTC-6)
  </sub>

</p>

`;


    // ─────────────────────────────────────────
    // REPLACE BETWEEN MARKERS
    // ─────────────────────────────────────────

    const newReadme =
        readme.slice(
            0,
            startIndex + start.length
        ) +
        content +
        readme.slice(endIndex);


    fs.writeFileSync(
        path,
        newReadme
    );
}


// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {

    if (!API_KEY) {

        throw new Error(
            "REEF_API_KEY is missing."
        );
    }


    console.log(
        "Getting latest @VisitMexico posts..."
    );

    const posts =
        await getPosts();


    if (
        !Array.isArray(posts) ||
        posts.length === 0
    ) {

        throw new Error(
            "No Instagram posts found."
        );
    }


    console.log(
        "Getting Mexico weather..."
    );

    const weather =
        await getWeather();


    updateReadme(
        posts,
        weather
    );


    console.log(
        "README updated successfully."
    );
}


main().catch(error => {

    console.error(error);

    process.exit(1);
});