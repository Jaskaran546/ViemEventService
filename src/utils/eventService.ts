import { Address } from "viem";
import { BATCH_BLOCK_RANGE, EVENT_NAME, publicClient } from "./config";
import blockInfoModel from "../model/blockModel";
import userOpInfo from "../model/eventModel";
import multiSigAddressesInfo from "../model/multiSigAddresses";
import { entryPoint06Address, entryPoint06Abi } from "viem/account-abstraction";

export async function getEvents() {
  const senders = await multiSigAddressesInfo.find();
  const senderAddresses = senders.map((s) =>
    s.address.toLowerCase()
  ) as `0x${string}`[];

  const MAX_SENDER_FILTER = 256n; // RPC limit for args filters
  if (!senderAddresses.length) {
    console.log("⚠️ No addresses to track.");
    return;
  }

  const currentBlock = await publicClient.getBlockNumber();
  let lastProcessed = await getLastProcessedBlock(entryPoint06Address);

  // ✅ Initialize if no record exists (DB empty or deleted)
  if (lastProcessed === 0n) {
    const safeStart = currentBlock > BATCH_BLOCK_RANGE
      ? currentBlock - BATCH_BLOCK_RANGE
      : 0n;
    console.log(
      `⚠️ No previous block found. Initializing from block ${safeStart}`
    );
    await updateLastProcessedBlock(entryPoint06Address, safeStart);
    lastProcessed = safeStart;
  }

  if (lastProcessed >= currentBlock) {
    console.log("No historical events to sync.");
    return;
  }

  let from = lastProcessed + 1n;
  const to = currentBlock;

  console.log(
    `Syncing from block ${from} to ${to} for ${senderAddresses.length} senders`
  );

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  while (from <= to) {
    const chunkEnd =
      from + BATCH_BLOCK_RANGE - 1n <= to ? from + BATCH_BLOCK_RANGE - 1n : to;

    console.log(`Fetching logs ${from} -> ${chunkEnd}`);

    // 🔥 Break senders into batches of 256
    const batches = [];
    for (
      let i = 0;
      i < senderAddresses.length;
      i += Number(MAX_SENDER_FILTER)
    ) {
      batches.push(senderAddresses.slice(i, i + Number(MAX_SENDER_FILTER)));
    }

    for (const batch of batches) {
      const logs = await publicClient.getContractEvents({
        address: entryPoint06Address,
        abi: entryPoint06Abi,
        eventName: EVENT_NAME,
        fromBlock: from,
        toBlock: chunkEnd,
        args: {
          sender: batch, // ✅ only up to 256 at a time
        },
      });

      if (logs.length) {
        for (const log of logs) {
          await saveEvent(log);
          // update last processed after each log to be conservative
          await updateLastProcessedBlock(entryPoint06Address, log.blockNumber);
        }
      } else {
        // If no logs in this chunk, still advance lastProcessedBlock to chunkEnd
        await updateLastProcessedBlock(entryPoint06Address, chunkEnd);
      }

      await sleep(1000); // small delay to avoid RPC spam
    }

    from = chunkEnd + 1n;
  }

  console.log("✅ Events sync complete.");
}

async function updateLastProcessedBlock(
  contractAddress: Address,
  blockNumberBigInt: bigint
) {
  await blockInfoModel.updateOne(
    { contractAddress },
    { contractAddress, lastProcessedBlock: blockNumberBigInt.toString() },
    { upsert: true }
  );
}

async function getLastProcessedBlock(contractAddress: Address) {
  const state = await blockInfoModel.findOne({ contractAddress });
  if (!state) return 0n;
  return BigInt(state.lastProcessedBlock);
}

async function saveEvent(log: {
  transactionHash: any;
  logIndex: any;
  blockNumber: { toString: () => any };
  args: { [key: string]: any };
}) {
  try {
    console.log("log", log);
    const item = {
      userOpHash: log.args.userOpHash,
      sender: log.args.sender,
      nonce: log.args.nonce?.toString(),
      paymaster: log.args.paymaster ?? null,
      blockNumber: log.blockNumber.toString(),
      txHash: log.transactionHash,
      logIndex: Number(log.logIndex),
    };
    await userOpInfo.create(item);
  } catch (err: any) {
    if (err.code === 11000) {
      console.log("Duplicate event skipped:", err.keyValue);
      return;
    }
    throw err;
  }
}