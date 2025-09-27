import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

//  currency converter API
app.get("/api/convert", async (req, res) => {
    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
        return res.json({ success: false, message: "Missing parameters" });
    }

    try {
        // Fetch rates for the "from" currency
        const response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
        const data = await response.json();

        if (!data || !data.rates || !data.rates[to]) {
            return res.json({
                success: false,
                message: `Invalid currency: ${to}`,
                rate: null,
                result: null,
            });
        }

        const rate = data.rates[to];
        const result = parseFloat(amount) * rate;

        res.json({
            success: true,
            amount: parseFloat(amount),
            from,
            to,
            rate,
            result,
        });
    } catch (err) {
        console.error("Error fetching exchange rate:", err);
        res.json({
            success: false,
            message: "Error fetching rates",
            error: err.message,
        });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});