// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Pool of Ethers
 * @author Fabiano Nascimento
 * @notice ETHPool provides a service where people can deposit ETH and they will receive weekly rewards.
 * Users are able to take out their deposits along with their portion of rewards at any time.
 * New rewards are deposited into the pool by the ETHPool team each week
 */
contract ETHPool is AccessControl, ReentrancyGuard {
    error InvalidAmount();
    error ZeroBalance();
    error NoActiveUsers();

    event Deposit(address user, uint256 amount);
    event Withdrawal(address user, uint256 amount);
    event RewardDeposit(uint256 amount);

    uint256 public poolBalance;

    // List of active users, who are able to receive the next rewards
    address[] public activeUsers;
    // mapping from user address to its balance
    mapping(address => uint) public balances;
    // mapping from user address to its index+1 in the {activeUsers} array
    mapping(address => uint) public activeUsersPosition;

    // Create a new role identifier for the team role
    bytes32 public constant TEAM_ROLE = keccak256("TEAM");

    constructor(address _manager) {
        // Grant the admin role for all roles to the publisher account
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Each role has an associated admin role. Set the admin role for TEAM role to a specific account
        _setupRole(getRoleAdmin(TEAM_ROLE), _manager);
    }

    /**
     * @notice Receive deposits from users. This function is called by the user when they deposit ETH to the pool.
     * @dev If the user has no balance, it is added to the {activeUsers} array and to the {activeUsersIndex} mapping.
     * In any case, the {balances} mapping is updated with the new balance of the user (previous + msg.value).
     *
     * @custom:error InvalidAmount: When msg.value is 0.
     */
    receive() external payable {
        if (msg.value == 0) {
            revert InvalidAmount();
        }
        poolBalance += msg.value;
        // if the user has no balance, it is not an active user.
        // In this case, add it to the activeUsers array.
        if (balances[msg.sender] == 0) {
            activeUsers.push(msg.sender);
            activeUsersPosition[msg.sender] = activeUsers.length;
        }
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Execute reward deposits from the Team and split the value proportionally between the active users. The
     *  rewards previously received and not withdrawn are considered in the users proportion
     * @dev Interacts with the {activeUsers} and update {balances} mapping with the new previous balance plus the proportional reward.
     *
     * @custom:error InvalidAmount: When msg.value is 0.
     */
    function depositReward() external payable onlyRole(TEAM_ROLE) {
        if (msg.value == 0) {
            revert InvalidAmount();
        }
        if (activeUsers.length == 0) {
            revert NoActiveUsers();
        }
        uint256 rewardValue = msg.value;
        for (uint256 i = 0; i < activeUsers.length; i++) {
            balances[activeUsers[i]] +=
                (rewardValue * balances[activeUsers[i]]) /
                poolBalance;
        }
        poolBalance += rewardValue;
        emit RewardDeposit(rewardValue);
    }

    /**
     * @notice Withdraws the user's full balance along with all weekly rewards already received
     *
     * @dev Set the balance of the user to 0, send it its balance, and remove it from the {activeUsers}
     *  array and the {activeUsersIndex} mapping.
     * @custom:error ZeroBalance: When the msg.sender balance is zero
     */
    function withdraw() external nonReentrant {
        if (balances[msg.sender] <= 0) {
            revert ZeroBalance();
        }
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        poolBalance -= amount;
        // remove from the sender from active users
        removeUser(msg.sender);
        emit Withdrawal(msg.sender, amount);
        // Not recommended to use transfer or send after EIP-1884 since it changes the cost of SLOAD
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent);
    }

    /**
     * @notice remove {_user} from active users
     *
     * @dev move the last element of {activeUsers} to the position of {user},
     *  update the {activeUsersIndex[lastElementAddress]} to the position that was from {user},
     *  pop the last element of {activeUsers}, and delete the reference of user in the
     *  activeUsersIndex[user] (Actually sets to default, zero)
     *
     * @param _user The user address to remove
     */
    function removeUser(address _user) private {
        if (activeUsers.length > 1) {
            uint256 idx = activeUsersPosition[_user] - 1;
            // Move is necessary only if it's not the last element
            if (idx != activeUsers.length - 1) {
                // copy the last element to the removed user's position
                activeUsers[idx] = activeUsers[activeUsers.length - 1];
                // updates the new index of the moved user
                activeUsersPosition[activeUsers[idx]] = idx + 1;
            }
        }
        // pop the last user from the array
        activeUsers.pop();
        // update the mapping activeUsersIndex
        delete activeUsersPosition[_user];
    }
}
