// server.js — Hostinger Node.js entry point
// Next.js custom server que respeta el puerto asignado por Hostinger (env PORT)

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev  = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app    = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> ZORA lista en puerto ${port} [${dev ? "dev" : "production"}]`);
    });
});
