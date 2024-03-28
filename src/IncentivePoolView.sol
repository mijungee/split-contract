pragma solidity ^0.8.11;

import "./common/upgradeable/Initializable.sol";
import "./interface/IncentivePoolFactoryInterface.sol";
import "./IncentivePool.sol";

contract IncentivePoolView is Initializable {
    /// @notice IncentivePoolFactory 컨트랙트 주소
    address public factory;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address factory_) public initializer {
        factory = factory_;
    }
}
