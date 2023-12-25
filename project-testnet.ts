import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";

const x_ethereum = {
  kind: EthereumDatasourceKind.Runtime,
  startBlock: 10213710,
  assets: new Map([
    // [
    //   "rootChainManager",
    //   {
    //     file: "./node_modules/@subql/contract-sdk/artifacts/contracts/mocks/RootChainManager.sol/RootChainManager.json",
    //   },
    // ],
    [
      "sQToken",
      {
        file: "./node_modules/@subql/contract-sdk/artifacts/contracts/root/SQToken.sol/SQToken.json",
      },
    ],
    // [
    //   "inflationController",
    //   {
    //     file: "./node_modules/@subql/contract-sdk/artifacts/contracts/root/InflationController.sol/InflationController.json",
    //   },
    // ],
    // [
    //   "polygonDestination",
    //   {
    //     file: "./node_modules/@subql/contract-sdk/artifacts/contracts/root/PolygonDestination.sol/PolygonDestination.json",
    //   },
    // ],
    // [
    //   "vesting",
    //   {
    //     file: "./node_modules/@subql/contract-sdk/artifacts/contracts/Vesting.sol/Vesting.json",
    //   },
    // ],
    [
      "eRC20Predicate",
      {
        file: "./artifacts/ERC20Predicate.json",
      },
    ],
  ]),
};

// Can expand the Datasource processor types via the generic param
const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "network-root-chain-backend",
  description:
    "This project can be use as a starting point for developing your new Ethereum SubQuery project",
  runner: {
    node: {
      name: "@subql/node-ethereum",
      version: ">=3.0.0",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /**
     * chainId is the EVM Chain ID, for Ethereum this is 1
     * https://chainlist.org/chain/1
     */
    chainId: "5",
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: ["https://rpc.ankr.com/eth_goerli"],
  },
  dataSources: [
    {
      ...x_ethereum,
      options: {
        abi: "sQToken",
        address: "0xAFD07FAB547632d574b38A72EDAE93fA23d1E7d7",
      },
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleTransfer",
            filter: {
              /**
               * Follows standard log filters https://docs.ethers.io/v5/concepts/events/
               * address: "0x60781C2586D68229fde47564546784ab3fACA982"
               */
              topics: [
                "Transfer(address indexed from, address indexed to, uint256 amount)",
              ],
            },
          },
        ],
      },
    },
    // {
    //   ...x_ethereum,
    //   options: {
    //     abi: "inflationController",
    //     address: "0xB612080559f0102C5d60A034C841D72b7709ffE6",
    //   },
    //   mapping: {
    //     file: "./dist/index.js",
    //     handlers: [
    //       {
    //         kind: EthereumHandlerKind.Call,
    //         handler: "handleSetInflationDestination",
    //         filter: {
    //           function:
    //             "setInflationDestination(address _inflationDestination)",
    //         },
    //       },
    //       {
    //         kind: EthereumHandlerKind.Call,
    //         handler: "handleMintInflatedTokens",
    //         filter: {
    //           function: "mintInflatedTokens()",
    //         },
    //       },
    //       {
    //         kind: EthereumHandlerKind.Call,
    //         handler: "handleMintSQT",
    //         filter: {
    //           function: "mintSQT(address _destination, uint256 _amount)",
    //         },
    //       },
    //     ],
    //   },
    // },
    // {
    //   ...x_ethereum,
    //   options: {
    //     abi: "polygonDestination",
    //     address: "0x3519c8939b73EAA440A5b626D6090275add4bD69",
    //   },
    //   mapping: {
    //     file: "./dist/index.js",
    //     handlers: [
    //       {
    //         kind: EthereumHandlerKind.Call,
    //         handler: "handleAfterReceiveInflatedTokens",
    //         filter: {
    //           function: "afterReceiveInflatedTokens(uint256 tokenAmount)",
    //         },
    //       },
    //     ],
    //   },
    // },
    {
      ...x_ethereum,
      options: {
        abi: "eRC20Predicate",
        address: "0xdD6596F2029e6233DEFfaCa316e6A95217d4Dc34",
      },
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleLockedERC20",
            filter: {
              topics: [
                "LockedERC20(address indexed depositor, address indexed depositReceiver, address indexed rootToken, uint256 amount)",
                null,
                null,
                "",
              ],
            },
          },
          // {
          //   kind: EthereumHandlerKind.Call,
          //   handler: "handleExitToken",
          //   filter: {
          //     function:
          //       "exitToken(address, address rootToken, bytes memory log)",
          //   },
          // },
        ],
      },
    },
  ],
  repository: "https://github.com/subquery/network-root-chain-backend",
};

// Must set default to the project instance
export default project;
