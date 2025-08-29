import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { entryPoint06Address, entryPoint06Abi } from "viem/account-abstraction";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    // "https://base-sepolia.api.onfinality.io/public"
    "https://sepolia.base.org"
    // "https://base-sepolia.drpc.org"
  ),
});

export const entryPointContract = {
  address: entryPoint06Address,
  abi: entryPoint06Abi,
  publicClient,
};

export const BATCH_BLOCK_RANGE = 1000n;

export const EVENT_NAME = "UserOperationEvent";
