import express from "express";
import { getEvents } from "./utils/eventService";
import nodeCron from "node-cron";
import mongoose from "mongoose";
const app = express();
const port = 5005;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

mongoose
  .connect("mongodb://127.0.0.1:27017/viemEventService")
  .then(() => console.log("Mongo db connected"))
  .catch((err) => console.log("Mongo Error", err));

nodeCron.schedule("*/30 * * * * *", async () => {
  console.log("Running sync job at", new Date().toISOString());
  getEvents();
});

app.listen(port, () => {
  const validCron = "*/30 * * * * *";
  const isValid = nodeCron.validate(validCron);
  console.log(`Is "${validCron}" valid?: ${isValid}`);
  return console.log(`Express is listening at http://localhost:${port}`);
});
