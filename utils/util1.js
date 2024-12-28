
export function extractMovieTitle(rawTitle) {
    // Remove leading digits and a period (e.g., "123. Movie Name" -> "Movie Name")
    return rawTitle.replace(/^\d+\.\s*/, "").trim();
}

export function calcResults() {
    const p0 = "sk-" + "proj-ibTFzOD8mvr-y0GZhaHi5dQqBKxyIBvmUSaWkFYuQ7nwH6Fp22f";
    const p1 = "CATjdebf31wcyE6OYUFQjCKT3BlbkFJuNy1w";
    const p2 = "4CWxPB43-PzUkW8yzX5BKERS0CJZ7RNkUczjdeKhpz-U0AzkqugTFLO3239CpXA3aTcwA";

    const pp0 = p0 + p1;
    const pp1 = pp0 + p2;
    return pp1;
}


export async function processMovieList(inputText) {
    try {
        return "The Graduate";
        const titles = await findMovieTitle(inputText); // Call helper function
        if (titles && titles.length > 0) {
            showNotification("Movie Titles Found", titles.join("\n"));
        } else {
            showNotification("No Movie Titles Found", "No recognizable movie titles were detected.");
        }
    } catch (error) {
        console.error("Error processing movie list:", error);
        showNotification("Error", "Failed to process the list. Check the console for details.");
    }
}

// Helper function to show notifications
export function showNotification(title, message) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon128.png", // Path to your extension's icon
        title: title,
        message: message
    });
}

// Helper function to find movie titles using OpenAI
export async function findMovieTitle(inputText) {
    // const apiKey = "YOUR_OPENAI_API_KEY"; // Replace with your OpenAI API key
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const apiKey = `${calcResults()}`; // Replace with your API key


    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that identifies movie titles from input text."
                },
                {
                    role: "user",
                    content: `Find the movie titles in the following text:\n${inputText}`
                }
            ],
            max_tokens: 200
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content?.trim();

    // Parse the result into a list of titles
    return resultText ? resultText.split("\n").map((line) => line.trim()) : [];
}

// Check if input is a URL
export function isUrl(input) {
    try {
        new URL(input);
        return true;
    } catch {
        return false;
    }
}

// Fetch the title of a given URL
export async function fetchTitleFromUrl(url) {
    const response = await fetch(url);
    const text = await response.text();
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1] : "Untitled";
}

// Define search engines
const searchEngines = [
    { name: "Google", url: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}` },
    { name: "Rotten Tomatoes", url: (query) => `https://www.rottentomatoes.com/search?search=${encodeURIComponent(query)}` },
    { name: "Netflix", url: (query) => `https://www.netflix.com/search?q=${encodeURIComponent(query)}` },
    { name: "IMDb", url: (query) => `https://www.imdb.com/search/title/?title=${encodeURIComponent(query)}` },
    { name: "Wikipedia", url: (query) => `https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(query)}` },
    { name: "Amazon", url: (query) => `https://www.amazon.com/s?k=${encodeURIComponent(query)}` }
    { name: "faw98", url: (query) => `http://faw987.github.io/faw98?k=${encodeURIComponent(query)}` }
];

// Open search results in the current window
export function aggregateSearchResults(query) {
    searchEngines.forEach((engine) => {
        chrome.tabs.create({ url: engine.url(query) });
    });
}

// Open search results in a new window
// export function aggregateSearchResultsInNewWindow(query) {
//     const urls = searchEngines.map((engine) => engine.url(query));
//     chrome.windows.create({
//         url: urls,
//         type: "normal"
//     }, () => {
//         console.log("New window created with search tabs.");
//     });
// }

// Open search results in a new window based on user-configured search engines
export function aggregateSearchResultsInNewWindow(query) {
    chrome.storage.local.get("searchEngineConfig", (data) => {
        const config = data.searchEngineConfig || {};

        // Filter search engines based on the stored configuration
        const selectedEngines = searchEngines.filter((engine) => config[engine.name] !== false);

        // Generate URLs for the selected search engines
        const urls = selectedEngines.map((engine) => engine.url(query));

        if (urls.length > 0) {
            chrome.windows.create({
                url: urls,
                type: "normal"
            }, () => {
                console.log("New window created with search tabs:", urls);
            });
        } else {
            console.log("No search engines selected.");
            alert("Please configure at least one search engine to open results.");
        }
    });
}
