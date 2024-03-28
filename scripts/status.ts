import { IncentivePool, IncentivePoolFactory, TestToken } from "@typechains";
import { ethers } from "hardhat";
import constants from "../constants";

const getContracts = async () => {
    const incentivePoolFactory = await ethers.getContract<IncentivePoolFactory>("IncentivePoolFactory");
    const testUSDC = await ethers.getContract<TestToken>("USDC");

    return {
        incentivePoolFactory,
        testUSDC,
    };
};

export const status = async () => {
    const { incentivePoolFactory, testUSDC } = await getContracts();

    console.log("\n🚧 상태 확인 🚧");
    console.log("IncentiveFactory 주소: ", incentivePoolFactory.address);
    console.log("IncentiveFactory Deployer 목록: ", await incentivePoolFactory.getDeployers());

    const pools = await incentivePoolFactory.getIncentivePoolAddresses();
    console.log("IncentiveFactory Pool 목록: ", pools);

    for (let i = 0; i < pools.length; i++) {
        console.log(`\n== 😛 ${i + 1}번째 풀`);
        const incentivePool = (await ethers.getContractAt("IncentivePool", pools[i])) as IncentivePool;
        console.log("풀 주소: ", incentivePool.address);
        console.log("풀 잔고: ", (await testUSDC.balanceOf(incentivePool.address)).toString());

        const affiliates = await incentivePool.getAffiliates();
        console.log("추천인 목록: ", affiliates);

        const users = await incentivePool.getUsers();
        console.log("사용자 목록: ", users);
    }
};

status();
