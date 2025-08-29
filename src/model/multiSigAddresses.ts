import mongoose from "mongoose";
import { unique } from "viem/chains";

const multiSigAddresses = new mongoose.Schema(
  {
    address: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);
const multiSigAddressesInfo = mongoose.model(
  "MultiSigAddresses",
  multiSigAddresses
);

export default multiSigAddressesInfo;
