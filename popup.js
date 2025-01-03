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
    const setAllButton = document.getElementById("setAll"); // Added Set All button
    const clearAllButton = document.getElementById("clearAll"); // Added Clear All button
    const resetTablesButton = document.getElementById("resetTablesButton"); // Added Clear All button

    configureButton.addEventListener("click", () => {
        chrome.windows.create({
            url: "config.html",
            type: "popup",
            width: 350,
            height: 400
        });
    });

    chrome.storage.local.get("test", (data) => {
        console.log("chrome.storage.local.get test:", data.test);
    });

    chrome.storage.local.get("mode", (data) => {
        console.log("EXTRA          chrome.storage.local.get mode:", data.mode);
    });


    function buildHtmlMovies(movies, moviesList) {
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
        });
    }

    function buildHtmlActors(actors, moviesList) {
        actors.forEach((actor) => {
            const item = document.createElement("div");
            item.className = "movie-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = actor;

            const link = document.createElement("a");
            link.textContent = actor;
            link.href = "#";
            // link.addEventListener("click", () => {
            //     handleMovieClick(extractMovieTitle(movie));
            // });

            item.appendChild(checkbox);
            item.appendChild(link);

            moviesList.appendChild(item);
        });
    }

    // Function to handle the search action
    function handleSearch() {
        const userQuery = queryInput.value.trim();
        if (userQuery) {
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
            inputContainer.classList.remove("hidden");
        } else if (context === "contextMenu") {

            let mmode = "";
            chrome.storage.local.get("mode", (data) => {
                mmode = data.mode;
                console.log(">>>>>>>>>>>>>>>>>> data:", data);
                console.log(">>>>>>>>>>>>>>>>>> mmode:", mmode);
            });

            chrome.storage.local.get("mode", (data) => {
                console.log(">>>>>>   chrome.storage.local.get mode:", data.mode);
            });

            console.log(">>> mmode:", mmode);

            if (mmode == 'movies') {
                chrome.runtime.sendMessage({action: "getMovies"}, (response) => {
                    const movies = response.movies || [];

                    console.log(">>> getMovies response:", response);

                    console.log("popup movies:", movies);

                    if (movies.length === 0) {
                        moviesList.innerHTML = "<p>No movies found.</p>";
                    } else {
                        buildHtmlMovies(movies, moviesList);
                        getMoreInfo.classList.remove("hidden");
                    }
                });
            }
            ;

            if (mmode == 'actor') {
                chrome.runtime.sendMessage({action: "getActors"}, (response) => {
                    const actors = response.actors || [];

                    console.log(">>> getActors response:", response);

                    console.log("popup actors:", actors);

                    if (actors.length === 0) {
                        moviesList.innerHTML = "<p>No actors found.</p>";
                    } else {
                        buildHtmlActors(actors, moviesList);
                        getMoreInfo.classList.remove("hidden");
                    }
                });
            };
        };
    });

    // Handle Set All Button Click
    setAllButton.addEventListener("click", () => {
        document.querySelectorAll(".movie-item input[type='checkbox']").forEach((checkbox) => {
            checkbox.checked = true;
        });
    });

    // Handle Clear All Button Click
    clearAllButton.addEventListener("click", () => {
        document.querySelectorAll(".movie-item input[type='checkbox']").forEach((checkbox) => {
            checkbox.checked = false;
        });
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
            chrome.runtime.sendMessage({action: "processMovies", movies: selectedMovies});
        } else {
            alert("Please select at least one movie.");
        }
    });

    // Handle movie link click
    function handleMovieClick(movieName) {
        console.log(`Movie clicked: ${movieName}`);
        aggregateSearchResultsInNewWindow(movieName);
    }

    //
// Save configuration
    openMovieTable.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: "getMovies"}, (response) => {
            const movies = response.movies || [];
            console.log("popup movies:", movies);
            const url1 = `https://faw987.github.io/faw105.html?movietitlelist=${encodeURIComponent(movies)}`;
            console.log(`url1=${url1}`);
            chrome.tabs.create({url: url1});

        });
    });

    //
// Save configuration
    openActorTable.addEventListener("click", () => {
        chrome.runtime.sendMessage({action: "getActors"}, (response) => {
            const actors = response.actors || [];
            console.log("popup actors:", actors);
            const url1 = `https://faw987.github.io/faw107.html?movieActorlist=${encodeURIComponent(actors)}`;
            console.log(`url1=${url1}`);
            chrome.tabs.create({url: url1});

        });
    });


    configureButton.addEventListener("click", () => {
        chrome.windows.create({
            url: "config.html",
            type: "popup",
            width: 350,
            height: 400
        });
    });


    // Save configuration
    resetTablesButton.addEventListener("click", () => {

        // console.log("resetTablesButton clicked");
        alert("resetTablesButton before send");

        chrome.runtime.sendMessage({action: "resetTables"}, () => {

            // Access the div element by its id
            const moviesList = document.getElementById('moviesList');

            // Clear the content of the div
            moviesList.innerHTML = '';

            // Clear the content of the div
            moviesList.replaceChildren();


            // Trigger a reflow by accessing the offsetHeight property
            void moviesList.offsetHeight;

            // console.log("resetTablesButton sendMessage complete");
            alert("resetTablesButton after send 1 - done");


        });

        alert("resetTablesButton after send 2");

    });

});

