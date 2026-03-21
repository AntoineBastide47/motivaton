import { TonClient, Address, TupleReader } from "@ton/ton";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const TON_ENDPOINT = process.env.TON_ENDPOINT || "https://testnet.toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = process.env.TON_API_KEY || "";

export interface OnChainChallenge {
  sponsor: string;
  beneficiary: string;
  challengeId: string;
  totalDeposit: bigint;
  totalCheckpoints: number;
  amountPerCheckpoint: bigint;
  claimedCount: number;
  endDate: number;
  active: boolean;
}

function getClient() {
  return new TonClient({ endpoint: TON_ENDPOINT, apiKey: TON_API_KEY || undefined });
}

function getContractAddress() {
  if (!CONTRACT_ADDRESS) throw new Error("CONTRACT_ADDRESS env var is not set.");
  return Address.parse(CONTRACT_ADDRESS);
}

function parseChallengeDataTuple(reader: TupleReader): OnChainChallenge {
  const sponsor = reader.readAddress().toString();
  const beneficiary = reader.readAddress().toString();
  const challengeId = reader.readString();
  const totalDeposit = reader.readBigNumber();
  const totalCheckpoints = Number(reader.readBigNumber());
  const amountPerCheckpoint = reader.readBigNumber();
  const claimedCount = Number(reader.readBigNumber());
  const endDate = Number(reader.readBigNumber());
  const active = reader.readBoolean();
  return { sponsor, beneficiary, challengeId, totalDeposit, totalCheckpoints, amountPerCheckpoint, claimedCount, endDate, active };
}

export async function getChallenge(idx: number): Promise<OnChainChallenge | null> {
  const client = getClient();
  const result = await client.runMethod(getContractAddress(), "challenge", [
    { type: "int", value: BigInt(idx) },
  ]);
  const tuple = result.stack.readTupleOpt();
  if (!tuple) return null;
  return parseChallengeDataTuple(tuple);
}
