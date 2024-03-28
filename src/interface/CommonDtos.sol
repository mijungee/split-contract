pragma solidity ^0.8.11;

interface CommonDtos {
    struct IncentiveInfo {
        address incentiveToken;
        uint256 incentiveAmountPerTransaction;
        uint256 affiliateAmountPerTransaction;
        uint256 userAmountPerTransaction;
        uint256 leftTransactionNum;
        uint256 maxTransactionNumPerWallet;
        uint256 endTimeStamp;
    }

    struct CreateIncentivePoolReq {
        IncentiveInfo incentiveInfo;
    }

    struct DeployIncentivePoolReq {
        address deployer;
        IncentiveInfo incentiveInfo;
    }

    struct ConnectedUserData {
        address[] users; // 사용자 지갑 주소
        uint256 leftTransactionNum; // 추천인이 보상을 받을 수 있는 (남아있는) TX 합
    }

    struct Referral {
        address affiliate;
        address user;
    }

    struct PoolUpdateInfo {
        address incentivePoolAddress;
        Referral[] referrals;
    }

    struct UpdateIncentivePoolsReq {
        PoolUpdateInfo[] info;
    }

    struct ProductInfo {
        address incentivePoolAddress;
        uint256 affiliateEarned;
        uint256 affiliateClaimed;
        uint256 userEarned;
        uint256 userClaimed;
    }

    struct GetUserDashboardDataRes {
        uint256 totalEarned;
        uint256 totalClaimed;
        uint256 productNum;
        uint256 totalTransactionNum;
        ProductInfo[] productInfos;
    }
}
