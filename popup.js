import {callOpenAI} from './utils/openai.js';
import {logInfo, logError} from './utils/logger.js';
import {aggregateSearchResultsInNewWindow, calcResults} from './utils/util1.js';
import {extractMovieTitle} from './utils/util1.js';

document.addEventListener("DOMContentLoaded", () => {
        const inputContainer = document.getElementById("inputContainer");
        const queryInput = document.getElementById("queryInput");
        const submitQuery = document.getElementById("submitQuery");
        const moviesList = document.getElementById("moviesList");
        const getMoreInfo = document.getElementById("getMoreInfo");
        const configureButton = document.getElementById("configureButton");

        configureButton.addEventListener("click", () => {
            chrome.windows.create({
                url: "config.html",
                type: "popup",
                width: 350,
                height: 400
            });
        });

        function buildHtml(movies, moviesList) {
            movies.forEach((movie) => {

                const item = document.createElement("div");
                item.className = "movie-item";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = movie;

                const link = document.createElement("a");
                link.textContent = movie;
                link.href = "#";
                link.addEventListener("click", () => {
                    handleMovieClick(extractMovieTitle(movie));
                });

                item.appendChild(checkbox);
                item.appendChild(link);

                moviesList.appendChild(item);
            })
        };


        // Function to handle the search action
        function handleSearch() {
            const userQuery = queryInput.value.trim();
            if (userQuery) {
                // Pre-process the input if needed
                const processedQuery = extractMovieTitle(userQuery);
                aggregateSearchResultsInNewWindow(processedQuery);
            } else {
                alert("Please enter a valid query.");
            }
        }

        // Handle Search Button Click
        submitQuery.addEventListener("click", handleSearch);

        // Handle Enter Key Press in the Input Field
        queryInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                handleSearch();
            }
        });


        // Determine the context: toolbar or context menu
        chrome.runtime.sendMessage({action: "getContext"}, (response) => {
            const context = response.context;

            if (context === "toolbar") {
                // Show input field for toolbar invocation
                inputContainer.classList.remove("hidden");
            } else if (context === "contextMenu") {
                // Handle context menu invocation (populate movie list)
                chrome.runtime.sendMessage({action: "getMovies"}, (response) => {
                    const movies = response.movies || [];

                    console.log("popup movies:", movies);

                    if (movies.length === 0) {
                        moviesList.innerHTML = "<p>No movies found.</p>";
                    } else {
                        buildHtml(movies, moviesList);
                        getMoreInfo.classList.remove("hidden");
                    }
                });
            }
        });

        // Handle Search Button Click
        // submitQuery.addEventListener("click", () => {
        //     const userQuery = queryInput.value.trim();
        //
        //     if (userQuery) {
        //         // Process the query
        //         aggregateSearchResultsInNewWindow(userQuery);
        //     } else {
        //         alert("Please enter a valid query.");
        //     }
        // });

        // Handle GetMoreInfo button click
        getMoreInfo.addEventListener("click", () => {
            const selectedMovies = [];
            document.querySelectorAll(".movie-item input[type='checkbox']").forEach((checkbox) => {
                if (checkbox.checked) {
                    selectedMovies.push(checkbox.value);
                }
            });

            if (selectedMovies.length > 0) {
                chrome.runtime.sendMessage({action: "processMovies", movies: selectedMovies});
                // window.close(); // Close the popup after processing HACK
            } else {
                alert("Please select at least one movie.");
            }
        });

        // Handle movie link click
        function handleMovieClick(movieName) {
            console.log(`Movie clicked: ${movieName}`);
            // Placeholder for further functionality
            // alert(`You clicked on: ${movieName}`);
            aggregateSearchResultsInNewWindow(movieName);
        }


// Helper function to find info abmovie titles using info about a movie
        async function findMovieTerseDesc(inputText, apiKey) {
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
                        {role: "system", content: 'Identify all movie titles in the given text.'},
                        {
                            role: "user",
                            content: `Generate a terse pithy one line description of this movie:${inputText}.`
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
            console.log(`background resultText ${resultText}`)
            return resultText ? resultText.split("\n").map((line) => line.trim()) : [];
        };
    }
)
//
// // Save configuration
// openMovieTable.addEventListener("click", () => {
//     // const config = {};
//     // checkboxContainer.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
//     //     const engineName = searchEngines[checkbox.dataset.index].name;
//     //     config[engineName] = checkbox.checked;
//     // });
//     //
//     // const newWindowPreference = newWindowCheckbox.checked;
//     //
//     // console.log(`before store newWindowPreference: ${newWindowPreference}`);
//     // // alert(`before store newWindowPreference: ${newWindowPreference}`);
//     //
//     // chrome.storage.local.set(
//     //     {searchEngineConfig: config, newWindowPreference},
//     //     () => {
//     //         // alert("Configuration saved!");
//     //         window.close();
//     //     }
//     // );
//     alert();
//     chrome.tabs.create({ url });
//
// });