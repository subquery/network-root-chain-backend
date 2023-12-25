// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EthereumLog } from "@subql/types-ethereum";
import { ethers } from "ethers";
import { Sqtoken, TokenHolder, Transfer, XcTransfer } from "../types";
import assert from "assert";

import { chainIdToReservedContractAddresses } from "./utils";
import { TransferEvent } from "../types/contracts/SQToken";
import { LockedERC20Event } from "../types/contracts/ERC20Predicate";

let chainId: number;

async function isReservedContract(address: string): Promise<boolean> {
  if (isNaN(chainId)) {
    chainId = (await api.getNetwork()).chainId;
  }
  const addresses = chainIdToReservedContractAddresses[chainId];
  return [addresses.eRC20DedicateAddress, addresses.sQTokenAddress].includes(
    ethers.utils.getAddress(address)
  );
}

async function isXcPredicateContract(address: string): Promise<boolean> {
  if (isNaN(chainId)) {
    chainId = (await api.getNetwork()).chainId;
  }
  const addresses = chainIdToReservedContractAddresses[chainId];
  return addresses.eRC20DedicateAddress === ethers.utils.getAddress(address);
}

export async function handleTransfer(
  event: EthereumLog<TransferEvent["args"]>
): Promise<void> {
  logger.info(`New transfer transaction log at block ${event.blockNumber}`);
  assert(event.args, "No event args");
  const { from, to, value } = event.args;
  const transfer = Transfer.create({
    id: `${event.transactionHash}-${event.logIndex}`,
    from,
    to,
    txHash: event.transactionHash,
    amount: value.toBigInt(),
    timestamp: new Date(Number(event.block.timestamp) * 1000),
    blockheight: BigInt(event.blockNumber),
  });
  await transfer.save();
  const tokenAddr = event.address;
  // #1 Process TokenHolder, (skip empty address)
  if (from !== ethers.constants.AddressZero) {
    let fromAccount = await TokenHolder.get(from);
    if (!fromAccount) {
      fromAccount = new TokenHolder(from, BigInt(0), tokenAddr);
    } else {
      fromAccount.balance = fromAccount.balance - event.args.value.toBigInt();
    }
    await fromAccount.save();
  }
  if (to !== ethers.constants.AddressZero) {
    let toAccount = await TokenHolder.get(to);
    if (!toAccount) {
      toAccount = new TokenHolder(to, BigInt(0), tokenAddr);
    }
    toAccount.balance = toAccount.balance + event.args.value.toBigInt();
    await toAccount.save();
  }
  // #2 Maintain circulatingSupply
  // mint: add circulatingSupply
  logger.info(`found transfer from ${from} to ${to}`);
  let token = await Sqtoken.get(tokenAddr);
  if (!token) {
    token = new Sqtoken(tokenAddr, BigInt(0), BigInt(0));
  }
  let addCirculating = false;
  let removeCirculating = false;
  // mint
  if (from === ethers.constants.AddressZero) {
    logger.info(`Mint at block ${event.blockNumber} from ${from}`);
    token.totalSupply += event.args.value.toBigInt();

    if (!(await isReservedContract(to))) {
      addCirculating = true;
    }
  }
  // burn: remove circulatingSupply
  if (to === ethers.constants.AddressZero) {
    logger.info(`Burn at block ${event.blockNumber} from ${from}`);
    token.totalSupply = token.totalSupply - event.args.value.toBigInt();

    if (!(await isReservedContract(from))) {
      removeCirculating = true;
    }
  }
  // treasury out: add circulatingSupply
  if (await isReservedContract(from)) {
    addCirculating = true;
  }
  // treasury in: remove circulatingSupply
  if (await isReservedContract(to)) {
    removeCirculating = true;
  }

  if (addCirculating && !removeCirculating) {
    token.circulatingSupply += event.args.value.toBigInt();
    logger.info(
      `circulatingSupply increase ${event.args.value.toBigInt()} to ${
        token.circulatingSupply
      }`
    );
  }
  if (removeCirculating && !addCirculating) {
    token.circulatingSupply -= event.args.value.toBigInt();
    logger.info(
      `circulatingSupply decrease ${event.args.value.toBigInt()} to ${
        token.circulatingSupply
      }`
    );
  }
  await token.save();

  // #3 Maintain cross chain transfer
  if (await isXcPredicateContract(from)) {
    const xcTransfer = XcTransfer.create({
      id: `${event.transactionHash}-${event.logIndex}`,
      tokenAddr: tokenAddr,
      fromRoot: false,
      amount: value.toBigInt(),
      from: to,
      to: to,
      txHash: event.transactionHash,
      timestamp: new Date(Number(event.block.timestamp) * 1000),
      blockheight: BigInt(event.blockNumber),
    });
    await xcTransfer.save();
  }
}

export async function handleLockedERC20(
  event: EthereumLog<LockedERC20Event["args"]>
): Promise<void> {
  logger.info("handleLockedERC20");
  assert(event.args, "No event args");

  const { depositor, depositReceiver, rootToken, amount } = event.args;

  const xcTransfer = XcTransfer.create({
    id: `${event.transactionHash}-${event.logIndex}`,
    tokenAddr: rootToken,
    fromRoot: true,
    amount: amount.toBigInt(),
    from: depositor,
    to: depositReceiver,
    txHash: event.transactionHash,
    timestamp: new Date(Number(event.block.timestamp) * 1000),
    blockheight: BigInt(event.blockNumber),
  });
  await xcTransfer.save();
}
