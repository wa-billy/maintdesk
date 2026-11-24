import { app } from "./src/app.js";
import { initDb } from "./src/config/db.js";
import { env } from "./src/config/env.js";

await initDb();
const server = app.listen(env.port, () => console.log(`API on: ${env.port}`));

process.on('SIGTERM', () => server.close(() => pool.end()));