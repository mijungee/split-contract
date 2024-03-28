import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { setup } from "@test/setup";
import { IncentivePool, IncentivePoolFactory, TestToken } from "@typechains";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { first } from "lodash";

describe("인센티브 풀 관련 테스트", () => {
    /* Signer */
    let admin: SignerWithAddress;
    let user: SignerWithAddress[];

    /* 컨트랙트 객체 */
    let incentivePoolFactory: IncentivePoolFactory;
    let testUSDC: TestToken;

    /* 테스트 스냅샷 */
    let initialSnapshotId: number;
    let snapshotId: number;

    // 풀 생성 수수료
    const POOL_CREATION_FEE = ethers.utils.parseEther("0.1");

    // 테스트 변수값
    let firstIncentivePool: IncentivePool;
    let secondIncentivePool: IncentivePool;
    let req: {
        incentiveInfo: {
            incentiveToken: string;
            incentiveAmountPerTransaction: BigNumber;
            affiliateAmountPerTransaction: BigNumber;
            userAmountPerTransaction: BigNumber;
            leftTransactionNum: number; // Total 101 USDC
            maxTransactionNumPerWallet: number;
            endTimeStamp: BigNumber;
        };
    };
    let initialAmount: BigNumber;

    before(async () => {
        /* 테스트에 필요한 컨트랙트 및 Signer 정보를 불러오는 함수 */
        ({ admin, users: user, incentivePoolFactory, testUSDC } = await setup());
        initialSnapshotId = await network.provider.send("evm_snapshot");
    });

    beforeEach(async () => {
        snapshotId = await network.provider.send("evm_snapshot");

        // 테스트 초기 설정
        req = {
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

        initialAmount = req.incentiveInfo.incentiveAmountPerTransaction.mul(req.incentiveInfo.leftTransactionNum);

        await testUSDC.connect(user[0]).mintFor(user[0].address, initialAmount);
        await testUSDC.connect(user[0]).approve(incentivePoolFactory.address, initialAmount);
        await incentivePoolFactory.connect(user[0]).createIncentivePool(req, { value: POOL_CREATION_FEE });

        await testUSDC.connect(user[1]).mintFor(user[1].address, initialAmount);
        await testUSDC.connect(user[1]).approve(incentivePoolFactory.address, initialAmount);
        await incentivePoolFactory.connect(user[1]).createIncentivePool(req, { value: POOL_CREATION_FEE });

        const pools = await incentivePoolFactory.getIncentivePoolAddresses();
        firstIncentivePool = await ethers.getContractAt("IncentivePool", pools[0]);
        secondIncentivePool = await ethers.getContractAt("IncentivePool", pools[1]);
    });

    afterEach(async () => {
        await network.provider.send("evm_revert", [snapshotId]);
    });

    after(async () => {
        await network.provider.send("evm_revert", [initialSnapshotId]);
    });

    // struct IncentiveInfo {
    //     IERC20 incentiveToken;
    //     uint256 incentiveAmountPerTransaction;
    //     uint256 affiliateAmountPerTransaction;
    //     uint256 userAmountPerTransaction;
    //     uint256 leftTransactionNum;
    //     uint256 maxTransactionNumPerWallet;
    //     uint256 endTimeStamp;
    // }

    // struct CreateIncentivePoolReq {
    //     IncentiveInfo incentiveInfo;
    // }

    describe("풀 생성 관련 테스트", () => {
        it("신규 풀 초기 설정이 정상적으로 이루어지는가?", async () => {
            // factory 설정 확인
            expect(await incentivePoolFactory.isValidPool(firstIncentivePool.address)).to.equal(true);
            expect(await incentivePoolFactory.deployerToIncentivePool(user[0].address)).to.equal(
                firstIncentivePool.address,
            );
            expect((await incentivePoolFactory.getIncentivePoolAddresses())[0]).to.equal(firstIncentivePool.address);
            expect((await incentivePoolFactory.getDeployers())[0]).to.equal(user[0].address);

            // 주소 설정 확인
            expect(await firstIncentivePool.factory()).to.equal(incentivePoolFactory.address);
            expect(await firstIncentivePool.poolAdmin()).to.equal(user[0].address);

            // incentiveInfo 설정 확인
            expect((await firstIncentivePool.incentiveInfo()).incentiveAmountPerTransaction).to.equal(
                req.incentiveInfo.incentiveAmountPerTransaction,
            );
            expect((await firstIncentivePool.incentiveInfo()).affiliateAmountPerTransaction).to.equal(
                req.incentiveInfo.affiliateAmountPerTransaction,
            );
            expect((await firstIncentivePool.incentiveInfo()).userAmountPerTransaction).to.equal(
                req.incentiveInfo.userAmountPerTransaction,
            );
            expect((await firstIncentivePool.incentiveInfo()).leftTransactionNum).to.equal(
                req.incentiveInfo.leftTransactionNum,
            );
            expect((await firstIncentivePool.incentiveInfo()).maxTransactionNumPerWallet).to.equal(
                req.incentiveInfo.maxTransactionNumPerWallet,
            );
        });

        it("초기 풀 수량 및 수수료가 정상적으로 이동하는가?", async () => {
            // 토큰 이동 확인
            expect(await testUSDC.balanceOf(firstIncentivePool.address)).to.equal(initialAmount);

            // 수수료 확인 (풀 2개 생성됨)
            expect(await ethers.provider.getBalance(incentivePoolFactory.address)).to.equal(POOL_CREATION_FEE.mul(2));
        });
    });

    describe("풀 업데이트 및 클레임 테스트", () => {
        let updateReq: {
            info: {
                incentivePoolAddress: string;
                referrals: { affiliate: string; user: string }[];
            }[];
        };

        beforeEach(async () => {
            updateReq = {
                info: [
                    {
                        incentivePoolAddress: firstIncentivePool.address,
                        referrals: [
                            { affiliate: user[2].address, user: user[3].address },
                            { affiliate: user[4].address, user: user[5].address },
                            { affiliate: user[4].address, user: user[6].address },
                            { affiliate: user[4].address, user: user[6].address },
                            { affiliate: user[7].address, user: user[8].address },
                            { affiliate: user[8].address, user: user[7].address },
                        ],
                    },
                    {
                        incentivePoolAddress: secondIncentivePool.address,
                        referrals: [
                            { affiliate: user[5].address, user: user[6].address },
                            { affiliate: user[5].address, user: user[7].address },
                            { affiliate: user[5].address, user: user[7].address },
                        ],
                    },
                ],
            };

            await incentivePoolFactory.connect(admin).updateIncentivePools(updateReq);
        });

        it("추천인 데이터 업데이트가 정상적으로 이루어지는가?", async () => {
            const user2TransactionNum = await firstIncentivePool.affiliateToLeftTransactionNum(user[2].address);
            expect(user2TransactionNum).to.equal(1);

            const user4TransactionNum = await firstIncentivePool.affiliateToLeftTransactionNum(user[4].address);
            expect(user4TransactionNum).to.equal(3);

            const user5TransactionNum = await secondIncentivePool.affiliateToLeftTransactionNum(user[5].address);
            expect(user5TransactionNum).to.equal(3);
        });

        it("사용자 데이터 업데이트가 정상적으로 이루어지는가?", async () => {
            const user2TransactionNum = await firstIncentivePool.affiliateToLeftTransactionNum(user[2].address);
            expect(user2TransactionNum).to.equal(1);

            const user4TransactionNum = await firstIncentivePool.affiliateToLeftTransactionNum(user[4].address);
            expect(user4TransactionNum).to.equal(3);

            const user5TransactionNum = await secondIncentivePool.affiliateToLeftTransactionNum(user[5].address);
            expect(user5TransactionNum).to.equal(3);
        });

        it("풀 전체 데이터 업데이트가 정상적으로 이루어지는가?", async () => {
            const affiliates = await firstIncentivePool.getAffiliates();
            expect(affiliates[0]).to.equal(user[2].address);
            expect(affiliates[1]).to.equal(user[4].address);

            const users = await firstIncentivePool.getUsers();
            expect(users[0]).to.equal(user[3].address);
            expect(users[1]).to.equal(user[5].address);
            expect(users[2]).to.equal(user[6].address);
        });

        it("관리자가 아닌 유저가 업데이트를 시도할 시 revert되는가?", async () => {
            await expect(incentivePoolFactory.connect(user[0]).updateIncentivePools(updateReq)).to.revertedWith(
                "ACCESS_DENIED",
            );
        });

        it("추천인 클레임이 정상적으로 이루어지는가?", async () => {
            await firstIncentivePool.connect(user[4]).claimAffiliateIncentive();
            expect(await testUSDC.balanceOf(user[4].address)).to.equal(
                req.incentiveInfo.affiliateAmountPerTransaction.mul(3),
            );

            expect(await firstIncentivePool.affiliateToClaimedTransactionNum(user[4].address)).to.equal(
                BigNumber.from(3),
            );

            await firstIncentivePool.connect(user[2]).claimAffiliateIncentive();
            expect(await testUSDC.balanceOf(user[2].address)).to.equal(req.incentiveInfo.affiliateAmountPerTransaction);

            expect(await firstIncentivePool.affiliateToClaimedTransactionNum(user[2].address)).to.equal(
                BigNumber.from(1),
            );

            const leftAmount = initialAmount.sub(req.incentiveInfo.affiliateAmountPerTransaction.mul(4));
            expect(await testUSDC.balanceOf(firstIncentivePool.address)).to.equal(leftAmount);
        });

        it("중복 클레임 시 정상적으로 에러를 반환하는가?", async () => {
            await firstIncentivePool.connect(user[7]).claimAffiliateIncentive();
            await expect(firstIncentivePool.connect(user[7]).claimAffiliateIncentive()).to.revertedWith(
                "NO_TRANSACTION",
            );
        });

        it("사용자 클레임이 정상적으로 이루어지는가?", async () => {
            await firstIncentivePool.connect(user[6]).claimUserIncentive();
            expect(await testUSDC.balanceOf(user[6].address)).to.equal(
                req.incentiveInfo.userAmountPerTransaction.mul(2),
            );

            expect(await firstIncentivePool.userToClaimedTransactionNum(user[6].address)).to.equal(BigNumber.from(2));
        });

        it("getUserDashboardData 데이터가 정상적으로 반환되는가?", async () => {
            await secondIncentivePool.connect(user[5]).claimAffiliateIncentive();
            // await firstIncentivePool.connect(user[5]).claimUserIncentive();

            const res = await incentivePoolFactory.getUserDashboardData(user[5].address);

            expect(res.totalEarned).to.equal(
                req.incentiveInfo.affiliateAmountPerTransaction.mul(3).add(req.incentiveInfo.userAmountPerTransaction),
            );
            expect(res.totalClaimed).to.equal(req.incentiveInfo.affiliateAmountPerTransaction.mul(3));

            expect(res.productNum).to.equal(BigNumber.from(2));
            expect(res.totalTransactionNum).to.equal(BigNumber.from(4));

            const productInfos = await res.productInfos.filter(
                (productInfo) => productInfo.incentivePoolAddress !== ethers.constants.AddressZero,
            );

            expect(productInfos[0].incentivePoolAddress).to.equal(firstIncentivePool.address);
            expect(productInfos[0].userEarned).to.equal(req.incentiveInfo.userAmountPerTransaction);
            expect(productInfos[0].userClaimed).to.equal(0);

            expect(productInfos[1].incentivePoolAddress).to.equal(secondIncentivePool.address);
            expect(productInfos[1].affiliateEarned).to.equal(req.incentiveInfo.affiliateAmountPerTransaction.mul(3));
            expect(productInfos[1].affiliateClaimed).to.equal(req.incentiveInfo.affiliateAmountPerTransaction.mul(3));
        });
    });
});
