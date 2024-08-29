// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingWithWhitelist {
    mapping(address => mapping(address => uint256)) public stakedBalances;
    mapping(address => bool) public whitelistedTokens;

    event Staked(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);

    constructor(address[] memory tokens) {
        for (uint256 i = 0; i < tokens.length; i++) {
            whitelistedTokens[tokens[i]] = true;
        }
    }

    function stake(address _token, uint256 _amount) public {
        require(whitelistedTokens[_token], "Token is not whitelisted");
        require(_amount > 0, "Amount must be greater than 0");
        IERC20 token = IERC20(_token);
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        stakedBalances[msg.sender][_token] += _amount;
        emit Staked(msg.sender, _token, _amount);
    }

    function withdraw(address _token, uint256 _amount) public {
        require(whitelistedTokens[_token], "Token is not whitelisted");
        require(_amount > 0, "Amount must be greater than 0");
        require(stakedBalances[msg.sender][_token] >= _amount, "Insufficient staked balance");
        IERC20 token = IERC20(_token);
        stakedBalances[msg.sender][_token] -= _amount;
        require(token.transfer(msg.sender, _amount), "Token transfer failed");
        emit Withdrawn(msg.sender, _token, _amount);
    }

    function isTokenWhitelisted(address _token) public view returns (bool) {
        return whitelistedTokens[_token];
    }
}