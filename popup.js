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

    //
    // if true movie button is shown else actor button is shown
    //
    function toggleButtons(showMovieTable) {
        const movieButton = document.getElementById('openMovieTable');
        const actorButton = document.getElementById('openActorTable');

        if (showMovieTable) {
            movieButton.classList.remove('hidden'); // Show Movie Table button
            actorButton.classList.add('hidden');   // Hide Actor Table button
        } else {
            movieButton.classList.add('hidden');   // Hide Movie Table button
            actorButton.classList.remove('hidden'); // Show Actor Table button
        }
    }

    function getCurrentTime() {
        // Get the current date and time
        const now = new Date();

        // Format the time in a 12-hour format with AM/PM
        const options = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            timeZoneName: 'short'
        };

        const formatter = new Intl.DateTimeFormat('en-US', options);
        const formattedTime = formatter.format(now);

        // Extract timezone abbreviation from the formatted string
        const [time, tz] = formattedTime.split(' ');

        // Return in "4:40 PM EST" format
        return `${time} ${tz}`;
    };


    const myTime = getCurrentTime();
    const myRelease = "0.93";
    document.title = `Movie Magic ${myRelease} - ${myTime} - ???`;

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


    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }


    async function fetchBodyText(url) {
        try {
            // Fetch the HTML content of the URL
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const htmlText = await response.text();

            // Parse the HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");

            // Get the inner text of the body
            const bodyText = doc.body.innerText;

            console.log("Body Text:", bodyText);
            return bodyText;
        } catch (error) {
            console.error("Failed to fetch body text:", error);
        }
    }


    // Function to handle the search action
    function handleSearch() {
        const userQuery = queryInput.value.trim();
        // if (userQuery) {
        //     const processedQuery = extractMovieTitle(userQuery);
        //     aggregateSearchResultsInNewWindow(processedQuery);
        // } else {
        //     alert("Please enter a valid query.");
        // }

        if (isValidURL(userQuery)) {
            try {
                // inputText = await renderAndExtractText(userQuery);
                // inputText = await openTabAndExtractWords(userQuery,500);
                const inputText = fetchBodyText(userQuery);
                // console.log(`Query: ${userQuery}. result: "${inputText}`);
                // results = await findTitles(inputText, queryType);
                // results = await findTitles(inputText, 'movies');
                //
                // findTitles(inputText, 'movies')
                //     .then(response => response.text())

                findTitles(inputText, 'movies').then((resp) => {
                    console.log(`Response:`, resp);
                    // responseText.textContent = resp;
                });

                console.log(`results: "${results}`);

            } catch (error) {
                alert(`Error rendering URL content: ${error.message}`);
                return;
            }
        } else {
// Pre-process the input if needed
            const processedQuery = extractMovieTitle(userQuery);
            aggregateSearchResultsInNewWindow(processedQuery);
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

    function paintDisplay(mmode) {

        document.title = `Movie Magic ${myRelease} - ${myTime} - ${mmode}`;

        if (mmode == 'movies') {


            toggleButtons(true);

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

        if (mmode == 'actors') {

            toggleButtons(false);

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
        }
        ;
    }

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
                paintDisplay(mmode);
            });

        }
        ;
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
    })
});