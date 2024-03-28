import { IncentivePoolFactory } from "@typechains";
import { Signer } from "ethers";
import { BaseContract } from "./base";

/**
 * example Contract library class
 * use in scripts, deploy_scripts, etc
 */

export class IncentivePoolFactoryContract extends BaseContract<IncentivePoolFactory> {
    // async exampleFunction(num_: number, signer: Signer) {
    //     return await (await this.contract.connect(signer).exampleFunction(num_, { gasPrice: this.gasPrice })).wait();
    // }
}
