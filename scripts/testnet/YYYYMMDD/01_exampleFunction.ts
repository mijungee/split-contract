import { IncentivePoolFactoryContract } from "@lib/mesher";
import { ethers, getNamedAccounts } from "hardhat";

/**
 * @dev scripts example template
 */

const main = async () => {
    const num_ = 100;

    const { developer } = await getNamedAccounts();
    const signer = await ethers.getSigner(developer);

    // 아래서부터 스크립트 실행
};

main();
