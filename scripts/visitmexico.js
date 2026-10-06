const fs = require("fs");

const API_KEY = process.env.REEF_API_KEY;
const USERNAME = "visitmexico";

const API_URL = "https://api.reefapi.com/instagram/v1/posts";

async function getPosts() {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: USERNAME,
            limit: 3
        })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
        throw new Error(
            `ReefAPI error: ${JSON.stringify(result)}`
        );
    }

    return result.data;
}

function getPostsArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.posts)) {
        return data.posts;
    }

    if (Array.isArray(data.items)) {
        return data.items;
    }

    return [];
}

function getImage(post) {
    if (post.display_url) {
        return post.display_url;
    }

    if (post.image_url) {
        return post.image_url;
    }

    if (post.thumbnail_url) {
        return post.thumbnail_url;
    }

    if (
        Array.isArray(post.carousel_media) &&
        post.carousel_media.length > 0
    ) {
        return (
            post.carousel_media[0].display_url ||
            post.carousel_media[0].image_url
        );
    }

    return null;
}

function getPostUrl(post) {
    if (post.permalink) {
        return post.permalink;
    }

    if (post.url) {
        return post.url;
    }

    if (post.shortcode) {
        return `https://www.instagram.com/p/${post.shortcode}/`;
    }

    return "https://www.instagram.com/visitmexico/";
}

function getMexicoDate() {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeZone: "America/Mexico_City"
    }).format(new Date());
}

function generateContent(posts) {
    const images = posts
        .slice(0, 3)
        .map((post) => {
            const image = getImage(post);
            const url = getPostUrl(post);

            if (!image) {
                return "";
            }

            return `<a href="${url}">
  <img
    src="${image}"
    width="250"
    alt="@VisitMexico Instagram post"
  />
</a>`;
        })
        .filter(Boolean);

    return `
<p align="center">
${images.join("\n")}
</p>

<p align="center">
  <sub>Last updated: ${getMexicoDate()}</sub>
</p>`;
}

function updateReadme(content) {
    const readmePath = "README.md";

    const readme = fs.readFileSync(
        readmePath,
        "utf8"
    );

    const startMarker =
        "<!-- VISITMEXICO:START -->";

    const endMarker =
        "<!-- VISITMEXICO:END -->";

    const startIndex =
        readme.indexOf(startMarker);

    const endIndex =
        readme.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
        throw new Error(
            "VISITMEXICO markers not found in README.md"
        );
    }

    const before = readme.slice(
        0,
        startIndex + startMarker.length
    );

    const after = readme.slice(
        endIndex
    );

    const newReadme =
        `${before}\n${content}\n\n${after}`;

    fs.writeFileSync(
        readmePath,
        newReadme
    );
}

async function main() {
    if (!API_KEY) {
        throw new Error(
            "REEF_API_KEY is not configured."
        );
    }

    console.log(
        "Fetching @VisitMexico posts..."
    );

    const data = await getPosts();

    const posts = getPostsArray(data);

    if (posts.length === 0) {
        throw new Error(
            "No posts were returned by ReefAPI."
        );
    }

    console.log(
        `Received ${posts.length} posts.`
    );

    const content =
        generateContent(posts);

    updateReadme(content);

    console.log(
        "README updated successfully."
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});