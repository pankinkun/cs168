// SPDX-License-Identifier: MIT

pragma solidity ^0.7;

// Updated version from https://theethereum.wiki/w/index.php/ERC20_Token_Standard
contract ERC20Token {

    string public constant _symbol = "PHO";
    string public constant _name = "Trique-Nguyen";

    mapping (address => uint) public _balances;

    mapping (address => bool) private _freezed;

    mapping(address => mapping(address => uint)) public _allowances;

    uint public _totalSupply;

    address private _owner;

    constructor(string memory name, string memory symbol) {
        name = _name;
        symbol = _symbol;
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner);
        _;
    } 

    function totalSupply() public virtual view returns (uint) {
        return _totalSupply;
    }

    function balanceOf(address tokenOwner) public virtual view returns (uint balance) {
        return _balances[tokenOwner];
    }

    function allowance(address tokenOwner, address spender) public virtual view returns (uint remaining) {
        return _allowances[tokenOwner][spender];
    }

    function transfer(address to, uint tokens) public virtual returns (bool success) {
        require(!_freezed[msg.sender]);
        require(_balances[msg.sender] >= tokens);
        require (_balances[to] + tokens >= _balances[to]);

        _balances[msg.sender] -= tokens;
        _balances[to] += tokens;

        emit Transfer(msg.sender, to, tokens);

        return true;
    }

    function approve(address spender, uint tokens) public virtual returns (bool success) {
        _allowances[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        return true;
    }

    function transferFrom(address from, address to, uint tokens) public virtual returns (bool success) {
        require(!_freezed[from]);
        require(_balances[from] >= tokens);
        require(_balances[to] + tokens >= _balances[to]);

        _balances[from] -= tokens;
        _balances[to] += tokens;

        emit Transfer(from, to, tokens);

        return true;
    }

    function freeze(address account) public onlyOwner {
        _freezed[account] = true;
    }

    function thaw(address account) public onlyOwner {
        _freezed[account] = false;
    }

    function burn(uint tokens) public {
        require(tokens <= _balances[msg.sender]);
        _balances[msg.sender] -= tokens;
        _totalSupply -= tokens;

        emit Transfer(msg.sender, address(0), tokens);
    }

    event Transfer(address indexed from, address indexed to, uint tokens);

    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}
