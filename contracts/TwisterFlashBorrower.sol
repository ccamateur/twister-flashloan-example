// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IERC3156FlashLender.sol";
import "./interfaces/IERC3156FlashBorrower.sol";

contract TwisterFlashBorrower is IERC3156FlashBorrower, ReentrancyGuard {

    using SafeERC20 for IERC20;
    bytes32 public constant CALLBACK_SUCCESS = keccak256(
        "ERC3156FlashBorrower.onFlashLoan"
    );

    address public owner;
    address public twisterPool;

    constructor(address _twisterPool) {
        owner = msg.sender;
        twisterPool = _twisterPool;
    }

    /**
     * @dev This is the point of entry for the EOA that controls this contract.
     * @param token The token to borrow.
     * @param amount The amount of token to borrow.
     * @param data Bytes encoded data that should trigger the specific logic of the flash loan.
     */
    function flashBorrow(address token, uint amount, bytes memory data)
        public
        nonReentrant
    {
        if (msg.sender != owner)
            revert MsgSenderIsNotOwner();
        IERC3156FlashLender(twisterPool).flashLoan(
            address(this), token, amount, data
        );
    }

    /**
     * @dev This is the point of entry for the flashLender pool. This is the logic of the flashloan.
     * @param initiator The address of this contract.
     * @param token The token that is being borrowed.
     * @param amount The amount of token that is being borrowed.
     * @param fee The amount of token that should be added to the return balance
     * in addition to the loaned amount.
     * @param data The encoded data sent by EOA.
     */
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes memory data
    ) external virtual override returns (bytes32) {
        if (msg.sender != twisterPool)
            revert MsgSenderIsNotTwisterPool();
        if (initiator != address(this))
            revert InvalidInitiator();

        /**
         * @dev The magic of the flashloan belongs here in this contract. For tests,
         * I just check if there is a fail param, to test pass/fail calls. However,
         * For this logic to be useful, you might encode some addresses that you want
         * to route through for an AMM. Here you would use something like:
         * (address tokenA, address tokenB) = abi.decode(data, (address, address));
         */
        require(data.length == 32);
        bool fail = abi.decode(data, (bool));
        if (fail) {
            return bytes32(0);
        }

        /**
         * @dev The flashlender will `transferFrom` the tokens after this returns the proper
         * CALLBACK_SUCESS value. If it fails, then the tx reverts.
         */
        IERC20(token).safeIncreaseAllowance(twisterPool, amount + fee);
        return CALLBACK_SUCCESS;
    }

    error InvalidInitiator();
    error MsgSenderIsNotOwner();
    error MsgSenderIsNotSelf();
    error MsgSenderIsNotTwisterPool();
}
