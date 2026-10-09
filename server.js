const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Database
const db = new sqlite3.Database("./quotes.db");

// Create favorites table
db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote TEXT NOT NULL,
        author TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Get a random quote from ZenQuotes API
app.get("/api/quote", async (req, res) => {
    try {
        const response = await fetch("https://zenquotes.io/api/random");

        if (!response.ok) {
            throw new Error("Quote API request failed");
        }

        const data = await response.json();

        if (!data[0] || !data[0].q) {
            throw new Error("Invalid quote data");
        }

        res.json({
            quote: data[0].q,
            author: data[0].a
        });

    } catch (error) {
        console.error("Quote API error:", error);

        // Fallback quote if API is unavailable
        res.json({
            quote: "The secret of getting ahead is getting started.",
            author: "Mark Twain",
            fallback: true
        });
    }
});

// Get favorite quotes
app.get("/api/favorites", (req, res) => {
    db.all(
        "SELECT * FROM favorites ORDER BY created_at DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// Save a favorite quote
app.post("/api/favorites", (req, res) => {
    const { quote, author } = req.body;

    if (!quote) {
        return res.status(400).json({
            error: "Quote is required"
        });
    }

    db.run(
        "INSERT INTO favorites (quote, author) VALUES (?, ?)",
        [quote, author || "Unknown"],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                id: this.lastID,
                quote,
                author: author || "Unknown"
            });
        }
    );
});

// Delete a favorite quote
app.delete("/api/favorites/:id", (req, res) => {
    db.run(
        "DELETE FROM favorites WHERE id = ?",
        [req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success: true
            });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Quote Generator running on http://localhost:${PORT}`);
});