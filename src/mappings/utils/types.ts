import { BigNumber, BytesLike } from "ethers";
import { TypedEvent } from "../../types/contracts/common";
import { EthereumTransaction } from "@subql/types-ethereum";

export interface LockedERC20Object {
  depositor: string;
  depositReceiver: string;
  rootToken: string;
  amount: BigNumber;
}
export declare type LockedERC20Event = TypedEvent<
  [string, string, string, BigNumber],
  LockedERC20Object
>;

export interface ExitTokenInterface {
  ExitTokenFunction(rootToken: string, log: BytesLike): void;
}

export type ExitTokenTransaction = EthereumTransaction<
  Parameters<ExitTokenInterface["ExitTokenFunction"]>
>;

export interface TransferEventObject {
  from: string;
  to: string;
  value: BigNumber;
}

export declare type TransferEvent = TypedEvent<
  [string, string, BigNumber],
  TransferEventObject
>;
