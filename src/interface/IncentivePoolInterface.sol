pragma solidity ^0.8.11;

import "./CommonDtos.sol";

interface IncentivePoolInterface is CommonDtos {
    enum ClaimType {
        AFFILIATE,
        USER
    }

    function getIncentiveInfo() external view returns (IncentiveInfo memory);

    function affiliateToLeftTransactionNum(address affiliate) external view returns (uint256);

    function userToLeftTransactionNum(address user) external view returns (uint256);

    function affiliateToClaimedTransactionNum(address affiliate) external view returns (uint256);

    function userToClaimedTransactionNum(address user) external view returns (uint256);

    /// @notice Emitted when leftTransactionNum is added
    event AddLeftTransactionNum(uint256 addedTransactionNum, uint256 totalTransactionNum, uint256 addedIncentiveAmount);

    /// @notice Emitted when affiliate claim the incentive
    event ClaimIncentive(
        address indexed caller,
        ClaimType indexed claimType,
        uint256 claimTransactionNum,
        uint256 claimedValue
    );
}
