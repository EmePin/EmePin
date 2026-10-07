const fs = require("fs");

const WEATHER_API_URL =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=19.437609" +
    "&longitude=-99.10715" +
    "&current_weather=true" +
    "&daily=sunrise,sunset" +
    "&timezone=America/Mexico_City";


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
// LAST UPDATED
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
// UPDATE README
// ─────────────────────────────────────────────

function updateWeather(weather) {

    const path = "README.md";

    const readme =
        fs.readFileSync(path, "utf8");


    const start =
        "<!-- WEATHER:START -->";

    const end =
        "<!-- WEATHER:END -->";


    const startIndex =
        readme.indexOf(start);

    const endIndex =
        readme.indexOf(end);


    if (
        startIndex === -1 ||
        endIndex === -1
    ) {

        throw new Error(
            "WEATHER markers not found."
        );
    }


    // ─────────────────────────────────────────
    // WEATHER DATA
    // ─────────────────────────────────────────

    const currentWeather =
        weather.current_weather;


    const temperature =
        Math.round(
            currentWeather.temperature
        );


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

Currently, the weather in Mexico City is: **${temperature}°C, *${weatherDescription}***

Today, the sun rises at **${sunrise}** and sets at **${sunset}** (UTC-6).

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

    console.log(
        "Getting Mexico weather..."
    );


    const weather =
        await getWeather();


    updateWeather(weather);


    console.log(
        "Weather updated successfully."
    );
}


main().catch(error => {

    console.error(error);

    process.exit(1);
});