import express from "express";
import { getEvents } from "./utils/eventService";
import nodeCron from "node-cron";
import mongoose from "mongoose";
import multiSigAddressesInfo from "./model/multiSigAddresses";
import { addMultisig } from "./services/multisigService";

const app = express();
const port = 5005;
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/viemEventService")
  .then(() => console.log("Mongo db connected"))
  .catch((err) => console.log("Mongo Error", err));

nodeCron.schedule("*/30 * * * * *", async () => {
  console.log("Running sync job at", new Date().toISOString());
  try {
    await getEvents();
  } catch (err) {
    console.error("Error in cron:", err);
  }
});

app.listen(port, () => {
  const validCron = "*/30 * * * * *";
  const isValid = nodeCron.validate(validCron);
  console.log(`Is "${validCron}" valid?: ${isValid}`);
  return console.log(`Express is listening at http://localhost:${port}`);
});

app.post("/addMultisig", addMultisig);

app.get("/list", async (req, res) => {
  const senders = await multiSigAddressesInfo.find();
  res.json(senders);
});
