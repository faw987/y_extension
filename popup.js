import { callOpenAI } from './utils/openai.js';
import { logInfo, logError } from './utils/logger.js';
import { aggregateSearchResultsInNewWindow } from './utils/util1.js';
import { extractMovieTitle } from './utils/util1.js';

// document.addEventListener("DOMContentLoaded", () => {
    // const moviesList = document.getElementById("moviesList");
    // const getMoreInfo = document.getElementById("getMoreInfo");
    //
    // // Fetch movies from background script
    // chrome.runtime.sendMessage({ action: "getMovies" }, (response) => {
    //     const movies = response.movies || [];
    //     if (movies.length === 0) {
    //         moviesList.innerHTML = "<p>No movies found.</p>";
    //         getMoreInfo.disabled = true;
    //     } else {
    //         // Render movie list with checkboxes and links
    //         movies.forEach((movie) => {
    //             const item = document.createElement("div");
    //             item.className = "movie-item";
    //
    //             const checkbox = document.createElement("input");
    //             checkbox.type = "checkbox";
    //             checkbox.value = movie;
    //
    //             const link = document.createElement("a");
    //             link.textContent = movie;
    //             link.href = "#";
    //             link.addEventListener("click", () => {
    //                 handleMovieClick(extractMovieTitle(movie));
    //             });
    //
    //             item.appendChild(checkbox);
    //             item.appendChild(link);
    //             moviesList.appendChild(item);
    //         });
    //     }
    // });

    document.addEventListener("DOMContentLoaded", () => {
        const inputContainer = document.getElementById("inputContainer");
        const queryInput = document.getElementById("queryInput");
        const submitQuery = document.getElementById("submitQuery");
        const moviesList = document.getElementById("moviesList");
        const getMoreInfo = document.getElementById("getMoreInfo");

        function buildHtml(movies, moviesList) {
            movies.forEach((movie) => {
                // const item = document.createElement("div");
                // item.textContent = movie;

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

                item.appendChild(link);
                item.appendChild(checkbox);

                moviesList.appendChild(item);
            });
    }

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
        chrome.runtime.sendMessage({ action: "getContext" }, (response) => {
            const context = response.context;

            if (context === "toolbar") {
                // Show input field for toolbar invocation
                inputContainer.classList.remove("hidden");
            } else if (context === "contextMenu") {
                // Handle context menu invocation (populate movie list)
                chrome.runtime.sendMessage({ action: "getMovies" }, (response) => {
                    const movies = response.movies || [];

                    console.log("popup movies:",movies);

                    if (movies.length === 0) {
                        moviesList.innerHTML = "<p>No movies found.</p>";
                    } else {
                        // movies.forEach((movie) => {
                        //     // const item = document.createElement("div");
                        //     // item.textContent = movie;
                        //
                        //     const item = document.createElement("div");
                        //     item.className = "movie-item";
                        //
                        //     const checkbox = document.createElement("input");
                        //     checkbox.type = "checkbox";
                        //     checkbox.value = movie;
                        //
                        //     const link = document.createElement("a");
                        //     link.textContent = movie;
                        //     link.href = "#";
                        //     link.addEventListener("click", () => {
                        //         handleMovieClick(extractMovieTitle(movie));
                        //     });
                        //
                        //     item.appendChild(link);
                        //     item.appendChild(checkbox);
                        //
                        //     moviesList.appendChild(item);
                        // });
                        buildHtml(movies, moviesList);
                        getMoreInfo.classList.remove("hidden");
                    }
                });
            }
        });

        // Handle Search Button Click
        submitQuery.addEventListener("click", () => {
            const userQuery = queryInput.value.trim();

            if (userQuery) {
                // Process the query
                aggregateSearchResultsInNewWindow(userQuery);
            } else {
                alert("Please enter a valid query.");
            }
        });

        // Simulated aggregateSearchResultsInNewWindow function
        // function aggregateSearchResultsInNewWindow(query) {
        //     console.log(`Opening tabs for query: ${query}`);
        //     // Replace with your actual function to open search tabs
        // }
    });


    // Handle GetMoreInfo button click
    getMoreInfo.addEventListener("click", () => {
        const selectedMovies = [];
        document.querySelectorAll(".movie-item input[type='checkbox']").forEach((checkbox) => {
            if (checkbox.checked) {
                selectedMovies.push(checkbox.value);
            }
        });

        if (selectedMovies.length > 0) {
            chrome.runtime.sendMessage({ action: "processMovies", movies: selectedMovies });
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

