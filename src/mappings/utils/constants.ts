export const networkToChainId = {
  mainnet: 1,
  testnet: 5,
};

export const chainIdToReservedContractAddresses = {
  [networkToChainId.mainnet]: {
    sQTokenAddress: "0x0",
    eRC20DedicateAddress: "0x0",
  },
  [networkToChainId.testnet]: {
    sQTokenAddress: "0xAFD07FAB547632d574b38A72EDAE93fA23d1E7d7",
    eRC20DedicateAddress: "0xdD6596F2029e6233DEFfaCa316e6A95217d4Dc34",
  },
};
