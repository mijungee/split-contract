import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * @dev this script is used for tests and deployments on hardhat network
 * @deployer person who deployed
 * @date deployed date
 * @description summary of this deployment
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments } = hre;
    const { deploy } = deployments;
    const [admin] = await ethers.getSigners();

    await deploy("IncentivePoolFactory", {
        from: admin.address,
        contract: "IncentivePoolFactory",
        proxy: {
            execute: {
                init: {
                    methodName: "initialize",
                    args: [admin.address, ethers.utils.parseEther("0.1")],
                },
            },
        },
        log: true,
        autoMine: true,
    });

    await deploy("USDC", {
        from: admin.address,
        contract: "TestToken",
        args: ["USDC coin", "USDC", 18],
        log: true,
        autoMine: true,
    });
};

export default func;
func.tags = ["001_deploy_contracts"];
