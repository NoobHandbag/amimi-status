// Invia una notifica push quando lo stato CAMBIA (OK -> problema, o problema ->
// OK). Confronta il verdetto attuale (status.json) con l'ultimo noto
// (last_state.txt). Gira dentro il workflow update-status dopo aver scaricato
// status.json. Le subscription arrivano dal collector (mode=subs, token).

const fs = require("fs");
const webpush = require("web-push");

(async () => {
  const status = JSON.parse(fs.readFileSync("status.json", "utf8"));
  const cur = status.state || "OK";

  let prev = "OK";
  try { prev = (fs.readFileSync("last_state.txt", "utf8").trim() || "OK"); } catch (e) {}
  fs.writeFileSync("last_state.txt", cur);

  if (cur === prev) { console.log("nessun cambio di stato:", cur); return; }
  console.log("CAMBIO STATO:", prev, "->", cur);

  let title, body;
  if (cur === "OK") {
    title = "✅ Amimì: tutto risolto";
    body = "I processi automatici sono di nuovo a posto.";
  } else {
    title = "⚠️ Amimì: c'è un problema";
    body = (status.issues && status.issues[0] && status.issues[0].text) || "Apri per i dettagli.";
  }
  const payload = JSON.stringify({
    title: title, body: body, url: "https://noobhandbag.github.io/amimi-status/"
  });

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY
  );

  const url = process.env.COLLECTOR_URL + "?mode=subs&token=" +
    encodeURIComponent(process.env.COLLECTOR_TOKEN);
  const res = await fetch(url, { redirect: "follow" });
  const data = await res.json();
  const subs = data.subs || [];
  console.log("iscrizioni:", subs.length);

  for (const s of subs) {
    const sub = { endpoint: s.ENDPOINT, keys: { p256dh: s.P256DH, auth: s.AUTH } };
    try {
      await webpush.sendNotification(sub, payload);
      console.log("inviato:", String(s.ENDPOINT).slice(0, 50));
    } catch (e) {
      console.log("errore", e.statusCode, "su", String(s.ENDPOINT).slice(0, 50));
    }
  }
})().catch(function (e) { console.error("notify fallito:", e.message); process.exit(0); });
