pragma solidity ^0.8.11;

import "./CommonDtos.sol";

interface IncentivePoolFactoryInterface is CommonDtos {
    /// @notice Emitted when leftTransactionNum is added
    event CreateIncentivePool(address caller, address poolAddress, uint256 initialAmount);
}
