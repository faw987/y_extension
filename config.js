document.addEventListener("DOMContentLoaded", () => {
    const checkboxContainer = document.getElementById("checkboxContainer");
    // const saveConfigButton = document.getElementById("saveConfig");
    const setAllButton = document.getElementById("setAll");
    const clearAllButton = document.getElementById("clearAll");
    const saveConfigButton = document.getElementById("saveConfig");


    const searchEngines = [
        { name: "Google" },
        { name: "Rotten Tomatoes" },
        { name: "IMDb" },
        { name: "Google" },
        { name: "Netflix" },
        { name: "Wikipedia" },
        { name: "Amazon" },
        { name: "faw98" }
    ];

        // Load stored configuration
    chrome.storage.local.get("searchEngineConfig", (data) => {
        const storedConfig = data.searchEngineConfig || {};
        searchEngines.forEach((engine, index) => {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.checked = storedConfig[engine.name] ?? true;
            checkbox.dataset.index = index;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${engine.name}`));
            checkboxContainer.appendChild(label);
        });
    });

    // Set All Checkboxes
    setAllButton.addEventListener("click", () => {
        checkboxContainer.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
            checkbox.checked = true;
        });
    });

    // Clear All Checkboxes
    clearAllButton.addEventListener("click", () => {
        checkboxContainer.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
            checkbox.checked = false;
        });
    });

    // Save configuration
    saveConfigButton.addEventListener("click", () => {
        const config = {};
        checkboxContainer.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
            const engineName = searchEngines[checkbox.dataset.index].name;
            config[engineName] = checkbox.checked;
        });

        const newWindowPreference = newWindowCheckbox.checked;

        chrome.storage.local.set(
            { searchEngineConfig: config, newWindowPreference },
            () => {
                // alert("Configuration saved!");
                window.close();
            }
        );
    });
});