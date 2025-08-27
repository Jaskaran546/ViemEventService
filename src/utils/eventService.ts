import { Address } from "viem";
import { entrypointAbi } from "../epV6.abi";
import {
  BATCH_BLOCK_RANGE,
  CONTRACT_ADDRESS,
  EVENT_NAME,
  publicClient,
} from "./config";
import blockInfoModel from "../model/blockModel";
import userOpInfo from "../model/eventModel";

export async function getEvents() {
  const lastProcessed = await getLastProcessedBlock(CONTRACT_ADDRESS);
  const currentBlock = await publicClient.getBlockNumber();

  if (lastProcessed >= currentBlock) {
    console.log("No historical events to sync.");
    return;
  }

  let from = lastProcessed + 1n;
  const to = currentBlock;

  console.log(`Syncing from block ${from} to ${to}`);

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  while (from <= to) {
    const chunkEnd =
      from + BATCH_BLOCK_RANGE - 1n <= to ? from + BATCH_BLOCK_RANGE - 1n : to;

    console.log(`fetching logs ${from} -> ${chunkEnd}`);
    const logs = await publicClient.getContractEvents({
      address: CONTRACT_ADDRESS,
      abi: entrypointAbi,
      eventName: EVENT_NAME,
      args: {
        sender: [
          "0x136aE0c79327E9Ceed137994E5876259aC5Ca1E3",
          "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          "0x5A384227B65FA093DEC03Ec34e111Db80A040615",
        ] as `0x${string}`[],
      },
      fromBlock: from,
      toBlock: chunkEnd,
    });

    if (logs.length) {
      for (const log of logs) {
        await saveEvent(log);
        // update last processed after each log to be conservative
        await updateLastProcessedBlock(CONTRACT_ADDRESS, log.blockNumber);
      }
    } else {
      // If no logs in this chunk, still advance lastProcessedBlock to chunkEnd to skip
      await updateLastProcessedBlock(CONTRACT_ADDRESS, chunkEnd);
    }

    from = chunkEnd + 1n;
    await sleep(1000);
  }

  console.log("Historical sync complete.");
}

async function updateLastProcessedBlock(
  contractAddress: Address,
  blockNumberBigInt: BigInt
) {
  // store as string for safety
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
      userOpHash: log.args.userOpHash, // decoded from topics
      sender: log.args.sender, // decoded from topics
      nonce: log.args.nonce?.toString(), // BigInt → String
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
