import { TestInterface } from "./interface";

/**
 * Return proper constants by Network ENV
 */

// should add networks here to use
export enum Network {
    hardhat = "hardhat",
    // eslint-disable-next-line camelcase
    testnet = "testnet",
    // ADD Networks
}

const { NETWORK } = process.env;

async function validateENV() {
    if (!NETWORK || !Object.values(Network).includes(NETWORK as Network))
        throw new Error("네트워크를 설정하지 않았거나 등록되지 않은 네트워크입니다.");
}
validateENV();

const networkPath = `./${process.env.NETWORK}`;

// Add Objects from constants of each file
const {
    testInfo,
    GAS_PRICE,
}: {
    testInfo: TestInterface;
    GAS_PRICE: number;
} = require(networkPath);

export default {
    testInfo,
    GAS_PRICE,
};
