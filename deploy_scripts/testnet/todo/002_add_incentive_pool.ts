import { IncentivePoolFactory, TestToken } from "@typechains";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * @dev sepolia testnet 인센티브 풀 추가 및 설정 스크립트
 * @deployer pengtoshi
 */

const GAS_PRICE = 1000000000;

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments } = hre;
    const { deploy } = deployments;
    const [admin] = await ethers.getSigners();

    const ethBalanceBeforeDeploy = await admin.getBalance();
    console.log(`⛽️ 설정 이전 ETH 잔고: ${ethBalanceBeforeDeploy} ETH`);

    const POOL_CREATION_FEE = ethers.utils.parseEther("0.0001"); // 0.0001 ETH

    const incentivePoolFactory = await ethers.getContract<IncentivePoolFactory>("IncentivePoolFactory");
    const initialPoolStatus = await incentivePoolFactory.getIncentivePoolAddresses();
    if (initialPoolStatus.length > 0) {
        throw Error("🚨 Check: 이미 풀이 배포되어 있어요.");
    }

    const testUSDC = await ethers.getContract<TestToken>("USDC");

    const createIncentivePoolReq = {
        incentiveInfo: {
            incentiveToken: testUSDC.address,
            incentiveAmountPerTransaction: ethers.utils.parseEther("0.101"), // 0.101 USDC
            affiliateAmountPerTransaction: ethers.utils.parseEther("0.1"), // 0.1 USDC
            userAmountPerTransaction: ethers.utils.parseEther("0.001"), // 0.001 USDC
            leftTransactionNum: 1000, // Total 101 USDC
            maxTransactionNumPerWallet: 5,
            endTimeStamp: ethers.constants.MaxUint256,
        },
    };

    const initialAmount = createIncentivePoolReq.incentiveInfo.incentiveAmountPerTransaction.mul(
        createIncentivePoolReq.incentiveInfo.leftTransactionNum,
    );

    await (await testUSDC.connect(admin).mintFor(admin.address, initialAmount, { gasPrice: GAS_PRICE })).wait();
    console.log("=== (⌛️ 1/3 ⌛️) TestUSDC 민팅 완료 🚀");

    await (
        await testUSDC.connect(admin).approve(incentivePoolFactory.address, initialAmount, { gasPrice: GAS_PRICE })
    ).wait();
    console.log("=== (⌛️ 2/3 ⌛️) TestUSDC approve 완료 🚀");

    await (
        await incentivePoolFactory
            .connect(admin)
            .createIncentivePool(createIncentivePoolReq, { value: POOL_CREATION_FEE, gasPrice: GAS_PRICE })
    ).wait();

    const pools = await incentivePoolFactory.getIncentivePoolAddresses();
    const incentivePool = await ethers.getContractAt("IncentivePool", pools[0]);

    console.log(
        "=== (⌛️ 3/3 ⌛️) IncentivePool 배포 및 초기 설정 완료 🚀, IncentivePool 주소: ",
        incentivePool.address,
    );

    const ethBalanceAfterDeploy = await admin.getBalance();
    console.log(`⛽️ 설정 완료 후 ETH 잔고: ${ethBalanceAfterDeploy} ETH`);
    console.log(`🥹  가스비 및 수수료로 사용한 ETH: ${ethBalanceBeforeDeploy.sub(ethBalanceAfterDeploy)} ETH`);
};

export default func;
func.tags = ["002_add_incentive_pool"];
