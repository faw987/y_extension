import { callOpenAI } from './utils/openai.js';
import {aggregateSearchResultsInNewWindow, calcResults} from './utils/util1.js';
import { logInfo, logError } from './utils/logger.js';
import { extractMovieTitle } from './utils/util1.js';

let movieTitles = [];
let movieActors = [];

// Add context menu items
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "movieTitle",
        title: "Titles",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: "movieActor",
        title: "Actors",
        contexts: ["selection"]
    });
});

chrome.storage.local.set({ test: "myData2" }, () => {});
// chrome.storage.local.set({ mode: "uninitialized" }, () => {});

chrome.storage.local.set({ mode: 'uninitialized' }, () => {
    if (chrome.runtime.lastError) {
        console.error('Error setting value for key=mode:', chrome.runtime.lastError);
    } else {
        console.log('Value set successfully key=mode value=uninitialized');
    }
});

// Respond to popup requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getMovies") {
        console.log("sendResponse({ movies: movieTitles - NEXT", movieTitles);
        sendResponse({ movies: movieTitles });
        // chrome.storage.local.set({ mode: "movies" }, () => {});
        console.log("sendResponse({ movies: movieTitles - AFTER", movieTitles);
    } else  if (message.action === "getActors") {
        console.log("sendResponse({ movies: getActors - NEXT", movieActors);
        sendResponse({ actors: movieActors });
        // chrome.storage.local.set({ mode: "actors" }, () => {});
        console.log("sendResponse({ movies: getActors - AFTER", movieActors);
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

chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "movieTitle" && info.selectionText) {
        invocationContext = "contextMenu"; // Update context
        const inputText = info.selectionText.trim();

        console.log("background inputText:",inputText);

        chrome.storage.local.set({ mode: 'movies' }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting value for key=mode value=movies:', chrome.runtime.lastError);
            } else {
                console.log('Value set successfully key=mode value=movies');
            }
        });

        findMovieTitles(inputText).then((titles) => {
            console.log("background titles:",titles);

            movieTitles = titles;

            if (titles.length === 1) {
                    // Directly process the single movie
                    const movieTitle = extractMovieTitle(titles[0]);
                    aggregateSearchResultsInNewWindow(movieTitle);
                } else {

                console.log("local set next titles:", titles);

                chrome.storage.local.set({movies: titles}, () => {
                    chrome.windows.create({
                        url: "popup.html",
                        type: "popup",
                        width: 400,
                        height: 600
                    });
                });
            };
        });
    };


    if (info.menuItemId === "movieActor" && info.selectionText) {
        invocationContext = "contextMenu"; // Update context
        const inputText = info.selectionText.trim();

        console.log("background inputText:", inputText);

        chrome.storage.local.set({ mode: 'actors' }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting value for key=mode value=actors:', chrome.runtime.lastError);
            } else {
                console.log('Value set successfully key=mode value=actors');
            }
        });



        findMovieActors(inputText).then((actors) => {
            console.log("background actors:", actors);

            movieActors = actors;

            if (actors.length === 1) {
                // // Directly process the single movie
                // const movieTitle = extractMovieTitle(titles[0]);
                // aggregateSearchResultsInNewWindow(movieTitle);
                alert(`There are exactly one actor. no further processing at this time`);
            } else {

                console.log("local set next actors:", actors);

                chrome.storage.local.set({actors: actors}, () => {
                    chrome.windows.create({
                        url: "popup.html",
                        type: "popup",
                        width: 400,
                        height: 600
                    });
                });
            }
            ;
        });
    }
    ;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "getContext") {
            sendResponse({context: invocationContext});
            // Reset context to default
            invocationContext = "toolbar";
        } else if (message.action === "getMovies") {
            console.log("background getMovies");
            chrome.storage.local.get("movies", (data) => {
                sendResponse({movies: data.movies || []});
                console.log("background data.movies:", data.movies);
            });
            return true; // Keep message channel open for async response
        } else if (message.action === "getActors") {
            console.log("background getActors");
            chrome.storage.local.get("actors", (data) => {
                sendResponse({actors: data.actors || []});
                console.log("background data.actors:", data.actors);
            });
            return true; // Keep message channel open for async response
        } else if (message.action === "resetTables") {
            console.log("background resetTables");
            chrome.storage.local.set({movies: ''}, () => {});
            chrome.storage.local.set({actors: ''}, () => {});
            movieTitles = [];
            movieActors = [];

            return true; // Keep message channel open for async response
        }
    }
);


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
                { role: "system", content: 'Identify all movie titles in the given text.'},
                {
                    role: "user",
                    content: `Extract movie titles from the following text:\n${inputText}. 
                    list each title on a seperate line. Do not number the results, just the title please.
                    no extranious punctuation. no leading hyphen.
                    Do not include "The movie title in the given text is" in the output, just the title.
                    double check your work.`
                 }
            ],
            max_tokens: 200
        })
    });

    if (!response.ok) {
        throw new Error(`findMovieTitles OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content?.trim();
    console.log(`background resultText ${resultText}`)
    return resultText ? resultText.split("\n").map((line) => line.trim()) : [];
};


// list movies with robert mitchum in the cast released between 1900 and 1950.
// for each moie provide the: title, release year
// and a one sentence terse pithy and consise summary
// if you can find one or more "star" ratings, provide all such star rating on a seperate line.


// Helper function to find movie titles using OpenAI
async function findMovieActors(inputText, apiKey) {
    const apiKey2 = `${calcResults()}`; // Replace with your API key

    const earliestYear = 1900;
    const latestYear = 1960;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey2}`
        },
        body: JSON.stringify({
            // model: "gpt-3.5-turbo",
            // model: "gpt-4o-mini",
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: 'Identify all movie actors in the given text.'},
                {
                    role: "user",
                    content:
                    //     `Extract a list of all movie actors from the following text:\n${inputText}.
                    // list each actor on a seperate line. Do not number the results, just the actor name please.
                    // double check your work.`
                    `list all actors and actresses mentioned here: "${inputText}".
                    each actors name should be listed on a seperate line with no additional added information.
                    just the actors name of a line by itself. no hyphen, asterisk or number.`
                }
            ],
            max_tokens: 200
        })
    });

    if (!response.ok) {
        throw new Error(`findMovieActors OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content?.trim();
    console.log(`background resultText ${resultText}`)
    return resultText ? resultText.split("\n").map((line) => line.trim()) : [];
    }
