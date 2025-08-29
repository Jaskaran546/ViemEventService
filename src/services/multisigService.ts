import { Request, NextFunction, Response } from "express";
import multiSigAddressesInfo from "../model/multiSigAddresses";

export async function addMultisig(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { addresses } = req.body;
    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({ error: "addresses[] required" });
    }

    const normalized = addresses.map((addr) => addr.toLowerCase());

    const results = await Promise.all(
      normalized.map(async (address) => {
        try {
          return await multiSigAddressesInfo.findOneAndUpdate(
            { address },
            { address },
            { upsert: true, new: true }
          );
        } catch (err) {
          return null;
        }
      })
    );

    res.json({ added: results.filter(Boolean) });
  } catch (err:any) {
    res.status(500).json({ error: err.message });
  }
}
