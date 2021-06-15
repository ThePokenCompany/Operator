const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

console.log(process.env);

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: process.env.MNEMONIC,
          },
          providerOrUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_PRIVATE_KEY}`,
        }),
      network_id: 4, // Rinkeby's id
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: process.env.MNEMONIC,
          },
          providerOrUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_PRIVATE_KEY}`,
        }),
      network_id: 4, // Rinkeby's id
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },
  contracts_directory: "./src/contracts/",
  contracts_build_directory: "./src/abis/",
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.4", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  db: {
    enabled: false,
  },
};
