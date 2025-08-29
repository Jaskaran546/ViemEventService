import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { entrypointAbi } from "../epV6.abi";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    // "https://base-sepolia.api.onfinality.io/public"
    "https://base-sepolia.drpc.org"
  
  ),
});

export const entryPointContract = {
  address: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
  abi: entrypointAbi,
  publicClient,
};

export const CONTRACT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789';

export const BATCH_BLOCK_RANGE = 1000n;

export const EVENT_NAME = "UserOperationEvent"