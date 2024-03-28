pragma solidity ^0.8.11;

import "./IncentivePoolStorage.sol";
import "./common/token/IERC20.sol";

contract IncentivePool is IncentivePoolStorage {
    modifier nonReentrant() {
        require(_notEntered, "ALREADY_ENTERED");
        _notEntered = false;
        _;
        _notEntered = true; // get a gas-refund post-Istanbul
    }

    constructor(DeployIncentivePoolReq memory req) {
        IncentiveInfo memory info = req.incentiveInfo;

        factory = msg.sender;
        poolAdmin = req.deployer;
        incentiveInfo = info;

        isClaimPaused = false;
        isUpdatePaused = false;

        _notEntered = true;
    }

    function getIncentiveInfo() external view returns (IncentiveInfo memory) {
        return incentiveInfo;
    }

    function getAffiliates() external view returns (address[] memory) {
        uint len = affiliates.length;
        address[] memory result = new address[](len);

        for (uint i = 0; i < len; i += 1) {
            address deployer = address(affiliates[i]);
            result[i] = deployer;
        }

        return result;
    }

    function getUsers() external view returns (address[] memory) {
        uint len = users.length;
        address[] memory result = new address[](len);

        for (uint i = 0; i < len; i += 1) {
            address deployer = address(users[i]);
            result[i] = deployer;
        }

        return result;
    }

    function addLeftTransactionNum(uint256 addedTransactionNum) external {
        require(msg.sender == factory || msg.sender == poolAdmin, "ACCESS_DENIED");

        uint256 addedIncentiveAmount = addedTransactionNum * incentiveInfo.incentiveAmountPerTransaction;
        IERC20(incentiveInfo.incentiveToken).transferFrom(msg.sender, address(this), addedIncentiveAmount);

        // msg.sender가 factory인 경우, 생성자에서 leftTransactionNum을 설정
        if (msg.sender != factory) {
            incentiveInfo.leftTransactionNum += addedTransactionNum;
        }

        emit AddLeftTransactionNum(addedTransactionNum, incentiveInfo.leftTransactionNum, addedIncentiveAmount);
    }

    function updatePool(Referral[] memory referrals) external {
        require(isUpdatePaused == false, "CLAIM_PAUSED");
        require(msg.sender == factory, "ACCESS_DENIED");

        for (uint256 i = 0; i < referrals.length; i++) {
            address affiliate = referrals[i].affiliate;
            address user = referrals[i].user;

            // 추천인 정보 업데이트
            ConnectedUserData storage userData = affiliateToLeftTransactionNum[affiliate];

            bool isRegisteredUser = isAffiliateUserRelated[affiliate][user];
            if (!isRegisteredUser) {
                isAffiliateUserRelated[affiliate][user] = true;
                userData.users.push(user);
            }

            userData.leftTransactionNum++;

            // 사용자 정보 업데이트
            userToLeftTransactionNum[user]++;

            // 전체 풀 정보 업데이트
            if (!isAffiliateExist[affiliate]) {
                isAffiliateExist[affiliate] = true;
                affiliates.push(affiliate);
            }
            if (!isUserExist[user]) {
                isUserExist[user] = true;
                users.push(user);
            }
        }
    }

    function claimAffiliateIncentive() external nonReentrant {
        require(isClaimPaused == false, "CLAIM_PAUSED");

        ConnectedUserData storage userData = affiliateToLeftTransactionNum[msg.sender];
        uint256 claimTransactionNum = userData.leftTransactionNum;

        userData.leftTransactionNum = 0;
        affiliateToClaimedTransactionNum[msg.sender] += claimTransactionNum;

        require(claimTransactionNum > 0, "NO_TRANSACTION");

        uint256 claimValue = claimTransactionNum * incentiveInfo.affiliateAmountPerTransaction;
        IERC20(incentiveInfo.incentiveToken).transfer(msg.sender, claimValue);

        emit ClaimIncentive(msg.sender, ClaimType.AFFILIATE, claimTransactionNum, claimValue);
    }

    function claimUserIncentive() external nonReentrant {
        require(isClaimPaused == false, "CLAIM_PAUSED");

        uint256 claimTransactionNum = userToLeftTransactionNum[msg.sender];
        require(claimTransactionNum > 0, "NO_TRANSACTION");

        userToLeftTransactionNum[msg.sender] = 0;
        userToClaimedTransactionNum[msg.sender] += claimTransactionNum;

        uint256 claimValue = claimTransactionNum * incentiveInfo.userAmountPerTransaction;
        IERC20(incentiveInfo.incentiveToken).transfer(msg.sender, claimValue);

        emit ClaimIncentive(msg.sender, ClaimType.USER, claimTransactionNum, claimValue);
    }
}
