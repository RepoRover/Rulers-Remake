import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env` });

import app from "./app";

const DB = process.env.DB.replace("<DB_PWD>", process.env.DB_PWD)
  .replace("<DB_USER>", process.env.DB_USER)
  .replaceAll("<DB_NAME>", process.env.DB_NAME)
  .replace("<DB_HOST>", process.env.DB_HOST)
  .replace("<DB_PORT>", process.env.DB_PORT);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful!"));

app.listen(
  process.env.PROCESS_PORT,
  console.log(`App is listening on port ${process.env.PROCESS_PORT}...`)
);
