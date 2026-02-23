import http from "node:http";
import { createRequire } from "node:module";
import cors from "cors";
import express from "express";
import { SnailRoom } from "./rooms/snail-room.js";

const require = createRequire(import.meta.url);
const { Server } = require("colyseus") as typeof import("colyseus");

const port = Number(process.env.PORT ?? 2567);

const app = express();
app.use(cors());
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "snail-server" });
});

const server = http.createServer(app);
const gameServer = new Server({ server });
gameServer.define("snail", SnailRoom);

gameServer.listen(port);

console.log(`Snail server listening on ws://localhost:${port}`);
console.log(`Health endpoint: http://localhost:${port}/health`);
