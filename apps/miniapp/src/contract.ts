import { TonClient, Address, beginCell, toNano, TupleReader } from "@ton/ton";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const TON_ENDPOINT = import.meta.env.VITE_TON_ENDPOINT || "https://testnet.toncenter.com/api/v2/jsonRPC";
const TON_API_KEY = import.meta.env.VITE_TON_API_KEY || "";

// Opcodes from compiled Tact ABI
const OP_CREATE_CHALLENGE = 0xf05423d0;
const OP_CLAIM_CHECKPOINT = 0x7b562c3f;
const OP_REFUND_UNCLAIMED = 0x70ccaed4;

function getClient() {
  return new TonClient({ endpoint: TON_ENDPOINT, apiKey: TON_API_KEY || undefined });
}

function getContractAddress() {
  if (!CONTRACT_ADDRESS) throw new Error("VITE_CONTRACT_ADDRESS is not set");
  return Address.parse(CONTRACT_ADDRESS);
}

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

/** Parses a ChallengeData tuple returned by the contract getter */
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

export async function getChallengeCount(): Promise<number> {
  const client = getClient();
  const result = await client.runMethod(getContractAddress(), "challengeCount");
  return Number(result.stack.readBigNumber());
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

export async function getAllChallenges(): Promise<(OnChainChallenge & { index: number })[]> {
  const count = await getChallengeCount();
  const challenges: (OnChainChallenge & { index: number })[] = [];
  for (let i = 0; i < count; i++) {
    const c = await getChallenge(i);
    if (c) challenges.push({ ...c, index: i });
  }
  return challenges;
}

export async function isCheckpointClaimed(challengeIdx: number, checkpointIdx: number): Promise<boolean> {
  const client = getClient();
  const result = await client.runMethod(getContractAddress(), "isCheckpointClaimed", [
    { type: "int", value: BigInt(challengeIdx) },
    { type: "int", value: BigInt(checkpointIdx) },
  ]);
  return result.stack.readBoolean();
}

/**
 * CreateChallenge: opcode(32) | beneficiary(addr) | challengeId(string ref tail) | totalCheckpoints(uint32) | endDate(uint64)
 */
export function buildCreateChallengeBody(
  beneficiary: string,
  challengeId: string,
  totalCheckpoints: number,
  endDate: number,
) {
  return beginCell()
    .storeUint(OP_CREATE_CHALLENGE, 32)
    .storeAddress(Address.parse(beneficiary))
    .storeStringRefTail(challengeId)
    .storeUint(totalCheckpoints, 32)
    .storeUint(endDate, 64)
    .endCell();
}

/**
 * ClaimCheckpoint: opcode(32) | challengeIdx(uint32) | checkpointIndex(uint32) | signature(ref cell)
 */
export function buildClaimCheckpointBody(
  challengeIdx: number,
  checkpointIndex: number,
  signatureBase64: string,
) {
  const sigBuf = Buffer.from(signatureBase64, "base64");
  const sigCell = beginCell().storeBuffer(sigBuf).endCell();

  return beginCell()
    .storeUint(OP_CLAIM_CHECKPOINT, 32)
    .storeUint(challengeIdx, 32)
    .storeUint(checkpointIndex, 32)
    .storeRef(sigCell)
    .endCell();
}

/**
 * RefundUnclaimed: opcode(32) | challengeIdx(uint32)
 */
export function buildRefundUnclaimedBody(challengeIdx: number) {
  return beginCell()
    .storeUint(OP_REFUND_UNCLAIMED, 32)
    .storeUint(challengeIdx, 32)
    .endCell();
}

export { toNano, CONTRACT_ADDRESS };
