import constants, { Network } from "@constants";
import { ContractReceipt } from "ethers";
import { ethers } from "hardhat";
import { isEqual } from "lodash";

export function IsAddress() {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        target.validators = {
            isAddress: {
                func: function (args: string[]) {
                    return ethers.utils.isAddress(args[parameterIndex]);
                },
                msg: "Invalid address",
            },
        };
    };
}

export function CheckReceipt(event?: { includedEvents?: string[]; excludedEvents?: string[] }) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const receipt = (await method.apply(this, args)) as ContractReceipt;

            if (receipt.status !== 1) throw new Error("Transaction Failed");

            if (event) {
                const { includedEvents, excludedEvents } = event;

                if (includedEvents) {
                    if (!receipt.events) throw new Error(`${includedEvents} Event is not emitted`);
                    includedEvents.forEach((name) => {
                        const target = receipt.events?.find((event) => isEqual(event.event, name));
                        if (!target) throw new Error(`${name} Event is not emitted`);
                    });
                }

                if (excludedEvents) {
                    excludedEvents.forEach((name) => {
                        const target = receipt.events?.find((event) => isEqual(event.event, name));
                        if (target) throw new Error(`${name} event is emitted, something wrong`);
                    });
                }
            }

            console.log("Transaction Successful 👍");
            console.log("Receipt ♾", receipt);

            return receipt;
        };
    };
}

export function Validate() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (...args: any[]) {
            Object.keys(target.validators).forEach((key) => {
                if (!target.validators[key].func(args)) {
                    throw new Error(`${target.validators[key].msg} ${args}`);
                }
            });

            return method.apply(this, args);
        };
    };
}

export abstract class BaseContract<T> {
    protected readonly network: Network;
    readonly contract: T;

    constructor(contract: T) {
        this.validateNetwork();
        this.network = process.env.NETWORK as Network;
        this.contract = contract;
    }

    validateNetwork() {
        const network = process.env.NETWORK;
        if (!network || !Object.values(Network).includes(network as Network))
            throw new Error("network를 설정해주세요.");
    }

    get gasPrice() {
        return constants.GAS_PRICE;
    }
}
