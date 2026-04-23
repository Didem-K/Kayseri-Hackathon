import { ethers } from "ethers";
import { CONTRACT_ABI } from "./contractABI";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { ethereum?: any; }
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "10143");

export async function getProvider() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

export async function getContract(withSigner = false) {
  if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured");
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }
  const provider = await getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function connectWallet(): Promise<string> {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: `0x${CHAIN_ID.toString(16)}` },
      ]);
    } catch {
      await provider.send("wallet_addEthereumChain", [
        {
          chainId: `0x${CHAIN_ID.toString(16)}`,
          chainName: "Monad Testnet",
          rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL ?? "https://testnet-rpc.monad.xyz"],
          nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
          blockExplorerUrls: ["https://testnet.monadexplorer.com"],
        },
      ]);
    }
  }

  const signer = await provider.getSigner();
  return signer.getAddress();
}

export async function depositTask(paymentEth: number): Promise<number> {
  const contract = await getContract(true);
  const tx = await contract.depositTask({
    value: ethers.parseEther(paymentEth.toString()),
  });
  const receipt = await tx.wait();

  // Parse TaskCreated event to get taskId
  const event = receipt.logs
    .map((log: ethers.Log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e: ethers.LogDescription | null) => e?.name === "TaskCreated");

  return event ? Number(event.args.taskId) : 0;
}

export async function assignTaskOnChain(
  contractTaskId: number,
  assigneeAddress: string
): Promise<void> {
  const contract = await getContract(true);
  const tx = await contract.assignTask(contractTaskId, assigneeAddress);
  await tx.wait();
}

export async function completeTaskOnChain(contractTaskId: number): Promise<void> {
  const contract = await getContract(true);
  const tx = await contract.completeTask(contractTaskId);
  await tx.wait();
}

export async function releasePaymentOnChain(contractTaskId: number): Promise<void> {
  const contract = await getContract(true);
  const tx = await contract.releasePayment(contractTaskId);
  await tx.wait();
}
