// SPDX-License-Identifier: MPL-2.0

pragma solidity 0.8;

// Updated version from https://theethereum.wiki/w/index.php/ERC20_Token_Standard
abstract contract ERC20Interface {

    function totalSupply() public virtual view returns (uint);

    function balanceOf(address tokenOwner) public virtual view returns (uint balance);

    function allowance(address tokenOwner, address spender) public virtual view returns (uint remaining);

    function transfer(address to, uint tokens) public virtual returns (bool success);

    function approve(address spender, uint tokens) public virtual returns (bool success);

    function transferFrom(address from, address to, uint tokens) public virtual returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);

    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);

}
