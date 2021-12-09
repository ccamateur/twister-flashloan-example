require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

const { DEV_PRIVATE_KEY } = process.env;

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // loggingEnabled: true,
            forking: { 
                url: 'https://rinkeby.arbitrum.io/rpc',
                blockNumber: 7382437
            }
        },
        // rinkArby: {
        //     accounts: [DEV_PRIVATE_KEY],
        //     url: 'https://rinkeby.arbitrum.io/rpc',
        // }
    },
    paths: {
        sources: "./contracts",
        cache: "./build/cache",
        artifacts: "./build/artifacts",
        tests: "./test",
    },
    solidity: {
        compilers: [
            {
                version: "0.6.11"
            },
            {
                version: "0.8.10",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000000,
                    }
                }
            },
        ]
    }
};
