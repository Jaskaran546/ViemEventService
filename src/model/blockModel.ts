import mongoose, { Document, model, Model } from "mongoose";

interface BlockInfo extends Document {
  eventName: string;
  contractAddress: string;
  lastProcessedBlock: string;
}

const blockModel = new mongoose.Schema<BlockInfo>(
  {
    id: {
      type: String,
      unique: true,
    },
    contractAddress: {
      type: String,
      unique: true,
    },
    lastProcessedBlock: {
      type: String,
      default: "0",
    },
  },
  { timestamps: true }
);

const blockInfoModel: Model<BlockInfo> = model<BlockInfo>(
  "blockModel",
  blockModel
);

export default blockInfoModel;
