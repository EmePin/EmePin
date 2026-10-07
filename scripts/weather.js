const fs = require("fs");

const WEATHER_API_URL =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=19.437609" +
    "&longitude=-99.10715" +
    "&current_weather=true" +
    "&daily=sunrise,sunset" +
    "&timezone=America/Mexico_City";

const WEATHER_DESCRIPTIONS = {
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

async function getWeather() {
    const response = await fetch(WEATHER_API_URL);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Open-Meteo error: ${JSON.stringify(data)}`);
    }

    return data;
}

function formatTime(dateTime) {
    return dateTime.slice(11, 16);
}

function getLastUpdated() {
    const now = new Date();
    const format = (timeZone) => new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeStyle: "short",
        hour12: false,
        timeZone
    }).format(now);

    return {
        utc: format("UTC"),
        utcMinusSix: format("Etc/GMT+6")
    };
}

function updateReadme(weather) {
    const path = "README.md";
    const readme = fs.readFileSync(path, "utf8");
    const start = "<!-- WEATHERMEXICO:START -->";
    const end = "<!-- WEATHERMEXICO:END -->";
    const startIndex = readme.indexOf(start);
    const endIndex = readme.indexOf(end);

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("WEATHERMEXICO markers not found.");
    }

    const currentWeather = weather.current_weather;
    const temperature = Math.round(currentWeather.temperature);
    const description = WEATHER_DESCRIPTIONS[currentWeather.weathercode] || "unknown weather";
    const sunrise = formatTime(weather.daily.sunrise[0]);
    const sunset = formatTime(weather.daily.sunset[0]);
    const lastUpdated = getLastUpdated();

    const content = `

<p align="center">

Currently, the weather is: **${temperature}°C, *${description}***

Today, the sun rises at **${sunrise}** and sets at **${sunset}** (UTC-6).

</p>

<p align="center">

  <sub>
    Last updated: ${lastUpdated.utc} (UTC+0) ·
    ${lastUpdated.utcMinusSix} (UTC-6)
  </sub>

</p>

`;

    fs.writeFileSync(
        path,
        readme.slice(0, startIndex + start.length) + content + readme.slice(endIndex)
    );
}

async function main() {
    console.log("Getting Mexico weather...");
    const weather = await getWeather();
    updateReadme(weather);
    console.log("Weather section updated successfully.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
