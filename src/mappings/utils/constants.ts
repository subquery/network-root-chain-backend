export const networkToChainId = {
  mainnet: 1,
  testnet: 5,
};

export const chainIdToReservedContractAddresses = {
  [networkToChainId.mainnet]: {
    sQTokenAddress: "0x000",
    eRC20DedicateAddress: "0x000",
  },
  [networkToChainId.testnet]: {
    sQTokenAddress: "0x000",
    eRC20DedicateAddress: "0xdD6596F2029e6233DEFfaCa316e6A95217d4Dc34",
  },
};
