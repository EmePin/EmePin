const fs = require("fs");

const API_KEY = process.env.REEF_API_KEY;

const INSTAGRAM_API_URL =
    "https://api.reefapi.com/instagram/v1/posts";

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
// LAST UPDATED
// ─────────────────────────────────────────────

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

function updateReadme(posts) {

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

    const lastUpdated = getLastUpdated();


    // ─────────────────────────────────────────
    // README CONTENT
    // ─────────────────────────────────────────

    const content = `

<p align="center">

Here are the last 3 posts by
<a href="https://www.instagram.com/visitmexico/">
@VisitMexico!
</a>

</p>

<p align="center">

${generatePosts(posts)}

</p>

<p align="center">

  <sub>
    Last updated: ${lastUpdated.utc} (UTC+0) ·
    ${lastUpdated.utcMinusSix} (UTC-6)
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


    updateReadme(posts);


    console.log(
        "README updated successfully."
    );
}


main().catch(error => {

    console.error(error);

    process.exit(1);
});
