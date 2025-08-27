import mongoose from "mongoose";

const userOpEvent = new mongoose.Schema(
  {
    userOpHash: { type: String, required: true, index: true },
    sender: { type: String, required: true },
    nonce: { type: String, required: true },
    paymaster: { type: String },
    blockNumber: { type: String, required: true },
    txHash: { type: String, required: true },
    logIndex: { type: Number, required: true },
  },
  { timestamps: true }
);
userOpEvent.index({ txHash: 1, logIndex: 1 }, { unique: true });
const userOpInfo = mongoose.model("UserOpEvent", userOpEvent);

export default userOpInfo;
