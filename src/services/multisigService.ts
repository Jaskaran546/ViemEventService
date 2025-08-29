import { Request, NextFunction, Response } from "express";
import multiSigAddressesInfo from "../model/multiSigAddresses";
import { isAddress } from "viem";

export async function addMultisig(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { address } = req.body;
    if (!address.length) return res.status(400).send("Invalid length");
    if (!isAddress(address)) return res.status(400).send("Not a valid address");
    console.log("address", address);
    if (!address) return res.status(400).send("Address required");

    const sender = await multiSigAddressesInfo.findOneAndUpdate(
      { address: address.toLowerCase() },
      { address: address.toLowerCase() },
      { upsert: true, new: true }
    );
    res.json(sender);
  } catch (err) {
    res.status(500).send(err);
  }
}
