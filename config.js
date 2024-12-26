document.addEventListener("DOMContentLoaded", () => {
    const checkboxContainer = document.getElementById("checkboxContainer");
    const saveConfigButton = document.getElementById("saveConfig");

    const searchEngines = [
        { name: "Google" },
        { name: "Rotten Tomatoes" },
        { name: "Netflix" },
        { name: "IMDb" },
        { name: "Wikipedia" },
        { name: "Amazon" }
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

    // Save configuration
    saveConfigButton.addEventListener("click", () => {
        const config = {};
        checkboxContainer.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
            const engineName = searchEngines[checkbox.dataset.index].name;
            config[engineName] = checkbox.checked;
        });

        chrome.storage.local.set({ searchEngineConfig: config }, () => {
            alert("Configuration saved!");
            window.close();
        });
    });
});