// Invia una notifica via ntfy quando lo stato CAMBIA (OK -> problema, o
// problema -> OK). Confronta il verdetto attuale (status.json) con l'ultimo noto
// (last_state.txt). Gira dentro il workflow update-status dopo aver scaricato
// status.json. Il canale ntfy e' un segreto del repo (NTFY_TOPIC).

const fs = require("fs");

(async () => {
  const status = JSON.parse(fs.readFileSync("status.json", "utf8"));
  const cur = status.state || "OK";

  let prev = "OK";
  try { prev = (fs.readFileSync("last_state.txt", "utf8").trim() || "OK"); } catch (e) {}
  fs.writeFileSync("last_state.txt", cur);

  if (cur === prev) { console.log("nessun cambio di stato:", cur); return; }
  console.log("CAMBIO STATO:", prev, "->", cur);

  const topic = process.env.NTFY_TOPIC;
  if (!topic) { console.error("NTFY_TOPIC mancante"); return; }

  let title, message, priority, tags;
  if (cur === "OK") {
    title = "✅ Amimì: tutto risolto";
    message = "I processi automatici sono di nuovo a posto.";
    priority = 3;
    tags = ["white_check_mark"];
  } else {
    title = "⚠️ Amimì: c'è un problema";
    message = (status.issues && status.issues[0] && status.issues[0].text) || "Apri per i dettagli.";
    if (status.issues && status.issues.length > 1) {
      message += " (+" + (status.issues.length - 1) + " altri)";
    }
    priority = 5;
    tags = ["warning"];
  }

  const res = await fetch("https://ntfy.sh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: topic,
      title: title,
      message: message,
      priority: priority,
      tags: tags,
      click: "https://noobhandbag.github.io/amimi-status/"
    })
  });
  console.log("ntfy:", res.status, await res.text());
})().catch(function (e) { console.error("notify fallito:", e.message); process.exit(0); });
