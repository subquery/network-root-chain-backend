import { EthereumLog } from "@subql/types-ethereum";
import { CrossChainTransfer, LockedERC20 } from "../types";
import { BigNumber } from "ethers";
import assert from "assert";
import { ExitTokenTransaction, LockedERC20Event } from "./utils/types";
import { RLP } from "ethers/lib/utils";

export async function handleLockedERC20(
  event: EthereumLog<LockedERC20Event["args"]>
): Promise<void> {
  logger.info("handleLockedERC20");
  assert(event.args, "No event args");

  const { depositor, depositReceiver, rootToken, amount } = event.args;

  await updateLockedERC20(rootToken, amount);

  const transfer = CrossChainTransfer.create({
    id: `${event.transactionHash}-${event.logIndex}`,
    from: depositor,
    to: depositReceiver,
    amount: amount.toBigInt(),
    blockHeight: BigInt(event.blockNumber),
    timestamp: new Date(Number(event.block.timestamp) * 1000),
    txHash: event.transactionHash,
  });
  await transfer.save();
}

async function updateLockedERC20(address: string, amount: BigNumber) {
  logger.info("updateLockedERC20");
  let locked = await LockedERC20.get(address);
  if (!locked) {
    locked = LockedERC20.create({
      id: address,
      amount: amount.toBigInt(),
    });
  } else {
    locked.amount = amount.add(locked.amount).toBigInt();
  }
  assert(locked.amount >= 0, "Locked amount should not be negative");
  await locked.save();
}

export async function handleExitToken(tx: ExitTokenTransaction) {
  logger.info("handleExitToken");
  assert(tx.args, "No event args");

  const [address, rootToken, log] = tx.args;
  const logRLPList = RLP.decode(log) as Array<any>;
  const logTopicRLPList = logRLPList[1] as Array<any>;
  const amount = BigNumber.from(logRLPList[2]);
  const withdrawer = BigNumber.from(logTopicRLPList[1]);

  await updateLockedERC20(rootToken, BigNumber.from(0).sub(amount));

  const transfer = CrossChainTransfer.create({
    id: `${tx.hash}-${tx.transactionIndex}`,
    from: address,
    to: withdrawer.toHexString(),
    amount: amount.toBigInt(),
    blockHeight: BigInt(tx.blockNumber),
    timestamp: new Date(Number(tx.blockTimestamp) * 1000),
    txHash: tx.hash,
  });
  await transfer.save();
}
