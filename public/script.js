let currentQuote = "";
let currentAuthor = "";

const quoteText = document.getElementById("quoteText");
const quoteAuthor = document.getElementById("quoteAuthor");
const favoritesList = document.getElementById("favoritesList");
const message = document.getElementById("message");

// Get a new quote
async function getQuote() {
    try {
        message.textContent = "Loading...";

        const response = await fetch("/api/quote");

        if (!response.ok) {
            throw new Error("Failed to get quote");
        }

        const data = await response.json();

        currentQuote = data.quote;
        currentAuthor = data.author;

        quoteText.textContent = `"${currentQuote}"`;
        quoteAuthor.textContent = `— ${currentAuthor}`;

        if (data.fallback) {
            message.textContent = "Using fallback quote.";
        } else {
            message.textContent = "";
        }

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to load quote.";
    }
}

// Save current quote
async function saveFavorite() {
    if (!currentQuote) {
        message.textContent = "Please get a quote first.";
        return;
    }

    try {
        const response = await fetch("/api/favorites", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                quote: currentQuote,
                author: currentAuthor
            })
        });

        if (!response.ok) {
            throw new Error("Failed to save favorite");
        }

        message.textContent = "❤️ Quote saved to favorites!";

        loadFavorites();

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to save favorite.";
    }
}

// Copy quote to clipboard
async function copyQuote() {
    if (!currentQuote) {
        message.textContent = "Please get a quote first.";
        return;
    }

    const textToCopy = `"${currentQuote}" — ${currentAuthor}`;

    try {
        await navigator.clipboard.writeText(textToCopy);

        message.textContent = "📋 Quote copied to clipboard!";

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to copy quote.";
    }
}

// Load favorite history
async function loadFavorites() {
    try {
        const response = await fetch("/api/favorites");

        if (!response.ok) {
            throw new Error("Failed to load favorites");
        }

        const favorites = await response.json();

        displayFavorites(favorites);

    } catch (error) {
        console.error(error);

        favoritesList.innerHTML =
            "<p>Unable to load favorite history.</p>";
    }
}

// Display favorite history
function displayFavorites(favorites) {
    if (favorites.length === 0) {
        favoritesList.innerHTML =
            "<p>No favorite quotes yet.</p>";
        return;
    }

    favoritesList.innerHTML = "";

    favorites.forEach(favorite => {
        const item = document.createElement("div");
        item.className = "favorite-item";

        item.innerHTML = `
            <div class="favorite-quote">
                "${favorite.quote}"
            </div>

            <div class="favorite-author">
                — ${favorite.author}
            </div>

            <button
                class="delete-btn"
                onclick="deleteFavorite(${favorite.id})">
                Delete
            </button>
        `;

        favoritesList.appendChild(item);
    });
}

// Delete favorite
async function deleteFavorite(id) {
    try {
        const response = await fetch(`/api/favorites/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete favorite");
        }

        loadFavorites();

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to delete favorite.";
    }
}

// Load a quote and favorites when page opens
getQuote();
loadFavorites();