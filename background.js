import { callOpenAI } from './utils/openai.js';
import {aggregateSearchResultsInNewWindow, calcResults} from './utils/util1.js';
import { logInfo, logError } from './utils/logger.js';
import { extractMovieTitle } from './utils/util1.js';

let movieTitles = [];

// Add the context menu
// chrome.runtime.onInstalled.addListener(() => {
//     chrome.contextMenus.create({
//         id: "findMovies",
//         title: "FindMovies",
//         contexts: ["selection"]
//     });
// });

// // Handle context menu clicks
// chrome.contextMenus.onClicked.addListener(async (info) => {
//     if (info.menuItemId === "findMovies" && info.selectionText) {
//         try {
//             // const apiKey = "YOUR_OPENAI_API_KEY";
//             const apiKey = `${calcResults()}`; // Replace with your API key
//
//             const inputText = info.selectionText.trim();
//             const titles = await findMovieTitles(inputText, apiKey);
//
//         //     if (titles && titles.length > 0) {
//         //         movieTitles = titles;
//         //         chrome.action.openPopup(); // Open popup with movies
//         //     } else {
//         //         alert("No movie titles found.");
//         //     }
//         // } catch (error) {
//         //     console.error("Error finding movies:", error);
//         //     alert("Failed to process the selected text.");
//         // }
//
//             if (titles && titles.length > 0) {
//                 if (titles.length === 1) {
//                     // Directly process the single movie
//                     const movieTitle = extractMovieTitle(titles[0]);
//                     aggregateSearchResultsInNewWindow(movieTitle);
//                 } else {
//                     // Store multiple movies and show popup
//                     // chrome.storage.local.set({ movies: titles }, () => {
//                     //     chrome.windows.create({
//                     //         url: "popup.html",
//                     //         type: "popup",
//                     //         width: 400,
//                     //         height: 600
//                     //     });
//                     // });
//                     movieTitles = titles;
//                     chrome.action.openPopup(); // Open popup with movies
//                 }
//             } else {
//                 alert("No movie titles found.");
//             }
//         } catch (error) {
//             console.error("Error finding movies:", error);
//             alert("Failed to process the selected text.");
//         }
//     }
// });
//
// Respond to popup requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getMovies") {
        sendResponse({ movies: movieTitles });
    } else if (message.action === "processMovies") {
        console.log("Processing movies:", message.movies);
        // Logic for opening tabs or fetching more info will go here
        if (Array.isArray(message.movies)) {
            message.movies.forEach((movie) => {
                aggregateSearchResultsInNewWindow(extractMovieTitle(movie));
            });
        }
    }
});

let invocationContext = "toolbar"; // Default to toolbar

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "findMovies",
        title: "FindMovies",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "findMovies" && info.selectionText) {
        invocationContext = "contextMenu"; // Update context
        const inputText = info.selectionText.trim();

        console.log("background inputText:",inputText);

        findMovieTitles(inputText).then((titles) => {
            console.log("background titles:",titles);

            if (titles.length === 1) {
                    // Directly process the single movie
                    const movieTitle = extractMovieTitle(titles[0]);
                    aggregateSearchResultsInNewWindow(movieTitle);
                } else {
                    chrome.storage.local.set({movies: titles}, () => {
                        chrome.action.openPopup();
                });
            };
        });
    };
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getContext") {
        sendResponse({ context: invocationContext });
        // Reset context to default
        invocationContext = "toolbar";
    } else if (message.action === "getMovies") {
        console.log("background getMovies");
        chrome.storage.local.get("movies", (data) => {
            sendResponse({ movies: data.movies || [] });
            console.log("background data.movies:",data.movies);
        });
        return true; // Keep message channel open for async response
    }
});


// Helper function to find movie titles using OpenAI
async function findMovieTitles(inputText, apiKey) {
    const apiKey2 = `${calcResults()}`; // Replace with your API key
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey2}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Identify all movie titles in the given text." },
                { role: "user", content: inputText }
            ],
            max_tokens: 200
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content?.trim();
    return resultText ? resultText.split("\n").map((line) => line.trim()) : [];
}