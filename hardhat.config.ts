/* eslint-disable node/no-unsupported-features/es-syntax */
import "@typechain/hardhat";
import "tsconfig-paths/register";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-log-remover";
import "hardhat-contract-sizer";
import { Network } from "@constants";
import { GAS_PRICE as TESTNET_GAS_PRICE } from "@constants/testnet";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";

enum Command {
    COMPILE = "compile",
    TEST = "test",
}

const { NETWORK, DEVELOPER_ACCOUNT, DEVELOPER_PRIVATE_KEY, CHAIN_ID, PROVIDER_URL } = process.env;

function validateENV() {
    const isBuilding = process.argv[2] === Command.COMPILE;
    const isTesting = process.argv[2] === Command.TEST;

    if (isBuilding || isTesting) return;

    if (!NETWORK || !Object.values(Network).includes(NETWORK as Network)) throw new Error("네트워크를 설정하세요.");

    if (DEVELOPER_ACCOUNT === undefined || DEVELOPER_PRIVATE_KEY === undefined) {
        throw new Error("환경변수 설정 오류입니다.(개발자 account 설정)");
    }

    if (NETWORK !== Network.hardhat.toString()) {
        if (!CHAIN_ID || !PROVIDER_URL) {
            throw new Error("환경변수 설정 오류입니다.(PROVIDER_URL 설정)");
        }
    }
}
validateENV();

function deployPath(): string {
    return `./deploy_scripts/${NETWORK}/todo`;
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.11",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    namedAccounts: {
        developer: 0,
    },
    networks: {
        hardhat: {
            live: false,
            tags: ["hardhat", "test"],
            chainId: 1337,
        },
        // replace with your network configuration
        testnet: {
            url: PROVIDER_URL || "",
            chainId: +(CHAIN_ID || 0),
            from: DEVELOPER_ACCOUNT || "",
            gas: "auto",
            gasPrice: TESTNET_GAS_PRICE,
            accounts: [DEVELOPER_PRIVATE_KEY || "0"],
        },
    },
    gasReporter: {
        enabled: !!process.env.REPORT_GAS,
        currency: "USD",
    },
    paths: {
        sources: "./src",
        tests: "./test/",
        cache: "./cache",
        artifacts: "./artifacts",
        deploy: deployPath(),
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: true,
        strict: true,
    },
    mocha: {
        timeout: 100000000,
    },
};

export default config;
