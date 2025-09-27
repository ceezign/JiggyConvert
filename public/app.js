const form = document.getElementById("converter");
const fromAmount = document.getElementById("fromAmount");
const fromCurrency = document.getElementById("fromCurrency");
const swapBtn = document.getElementById("swapBtn");
const toAmount = document.getElementById("toAmount");
const toCurrency = document.getElementById("toCurrency");
const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");
const rateInfo = document.getElementById("rateInfo");
const historyBox = document.getElementById("history");

// Common currency list (popular first)
const CURRENCIES = [
    "USD", "EUR", "GBP", "NGN", "KES", "GHS", "ZAR", "CAD", "AUD", "JPY", "CNY", "INR", "CHF", "SAR", "AED", "BRL", "MXN", "TRY"
];

// Populate the selects with currency options
function populate() {
    const allCurrencies = new Set(CURRENCIES);

    ["USD","EUR","GBP","NGN","JPY","CNY","INR","AUD"].forEach(x => allCurrencies.add(x));
    const arr = Array.from(allCurrencies);
    arr.forEach(cur => {
        const option1 = document.createElement("option");
        option1.value = cur;
        option1.textContent = cur;
        fromCurrency.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = cur;
        option2.textContent = cur;
        toCurrency.appendChild(option2);
    });

    fromCurrency.value = "USD";
    toCurrency.value = "NGN";

}
populate();

let lastResult = null;

async function convert(event) {
    if (event) event.preventDefault();
    const from = fromCurrency.value;
    const to = toCurrency.value;
    const amount = parseFloat(fromAmount.value);

    if (!from || !to || isNaN(amount)) {
        alert("Please enter a valid amount and select both currencies.");
        return;
    }

    // UI state
    convertBtn.disabled = true;
    convertBtn.textContent = "Converting...";

    try {
        const response = await fetch(`/api/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`);
        if (!response.ok) {
            const err = await response.json().catch(() =>({message:"Unexpected error"}));
            throw new Error(err.error || err.message || "Failed to fetch rates");
        }
        const data = await response.json();
        lastResult = data;

        // format result: show with up to 4 decimals intelligently
        const result = Number(data.result);
        toAmount.value = intlFormat(result, to);

        rateInfo.textContent = `1 ${from} = ${data.rate ? intlFormat(data.rate, to) : 
                                                "N/A"} ${to} • ${data.date ?? ""}`;

        pushHistory({
            time: new Date().toLocaleString(),
            from,
            to,
            amount,
            rate: data.rate,
            result: result
        });
    } catch (err) {
        console.error(err);
        alert("Conversion failed: " + err.message);
    } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = "Convert";
    }
}

function intlFormat(num, currency) {
    try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency, 
                                                    maximumFractionDigits: 6 }).format(num);
    } catch (err) {
        return Number(num).toFixed(4);
    }
}

function pushHistory(entry) {
    const doc = document.createElement("div");
    doc.className = "history-item";
    doc.style.padding = "6px 10px";
    doc.style.borderRadius = "8px";
    doc.style.background = "rgba(255,255,255,0.02)";
    doc.style.marginTop = "8px";
    doc.innerHTML = `<strong>${entry.amount} ${entry.from}</strong> → 
                    <strong>${intlFormat(entry.result, entry.to)}</strong> 
                    <div style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-top:6px">${entry.time} • 
                    rate: ${entry.rate ? entry.rate.toFixed(6) : "N/A"}</div>`;
    historyBox.prepend(doc);

    if (historyBox.children.length > 6) historyBox.removeChild(historyBox.lastChild);
}

swapBtn.addEventListener("click", () => {
    const a = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = a;

    const amt = fromAmount.value;
    fromAmount.value = toAmount.value ? parseFloat(toAmount.value.replace(/[^0-9.-]+/g,"")) : amt;
    toAmount.value = "";
    rateInfo.textContent = "";
});

clearBtn.addEventListener("click", () => {
    fromAmount.
    value = "";
    toAmount.value = "";
    rateInfo.textContent = "";
    historyBox.innerHTML = "";
});

form.addEventListener("submit", convert);

// Convert on pressing enter key in amount
fromAmount.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") convert();
});

// hepful quick convert when cuurency select changes
fromCurrency.addEventListener("change", () => { if (fromAmount.value) convert(); });
toCurrency.addEventListener("change", () => { if (fromAmount.value) convert(); });