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
// INSTAGRAM HTML
// ─────────────────────────────────────────────

function generatePosts(posts) {

    return posts
        .slice(0, 3)
        .map((post, index) => {

            const url =
                `https://www.instagram.com/p/${post.shortcode}/`;

            const separator =
                index < 2
                    ? "&nbsp;&nbsp;&nbsp;&nbsp;"
                    : "";

            return `<a
  href="${url}"
  style="text-decoration:none; background:transparent; border:0;"
>
  <img
    src="${post.display_url}"
    width="250"
    height="250"
    alt="@VisitMexico Instagram post"
    style="
      display:inline-block;
      width:250px;
      height:250px;
      object-fit:cover;
      border-radius:12px;
      border:0;
      vertical-align:middle;
    "
  />
</a>${separator}`;
        })
        .join("");
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


    const lastUpdated =
        getLastUpdated();


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
${lastUpdated.mexico} (Mexico, UTC-6)
</sub>

</p>

`;


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
        "Visit Mexico posts updated successfully."
    );
}


main().catch(error => {

    console.error(error);

    process.exit(1);
});