// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WyreGaslessForwarder
 * @dev EIP-712 Gasless Meta-Transaction Forwarder for WyreNet Subnet (ChainID: 51950)
 * Native Token: WYRE
 */
contract WyreGaslessForwarder {
    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
        uint256 validUntil;
    }

    bytes32 private constant TYPEHASH = keccak256(
        "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntil)"
    );

    bytes32 private immutable _domainSeparator;
    uint256 public immutable chainId;

    mapping(address => uint256) private _nonces;

    event MetaTransactionExecuted(
        address indexed from,
        address indexed to,
        uint256 value,
        uint256 nonce,
        bool success,
        bytes returnData
    );

    constructor() {
        chainId = block.chainid;
        _domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("WyreNet Sovereign Forwarder")),
                keccak256(bytes("1.0.0")),
                block.chainid,
                address(this)
            )
        );
    }

    function getNonce(address from) external view returns (uint256) {
        return _nonces[from];
    }

    function verify(ForwardRequest calldata req, bytes calldata sig) public view returns (bool) {
        if (block.timestamp > req.validUntil) return false;
        if (_nonces[req.from] != req.nonce) return false;

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _domainSeparator,
                keccak256(
                    abi.encode(
                        TYPEHASH,
                        req.from,
                        req.to,
                        req.value,
                        req.gas,
                        req.nonce,
                        keccak256(req.data),
                        req.validUntil
                    )
                )
            )
        );

        address signer = recoverSigner(digest, sig);
        return signer != address(0) && signer == req.from;
    }

    function execute(ForwardRequest calldata req, bytes calldata sig)
        external
        payable
        returns (bool success, bytes memory returnData)
    {
        require(verify(req, sig), "WyreForwarder: Signature verification failed");
        _nonces[req.from]++;

        (success, returnData) = req.to.call{gas: req.gas, value: req.value}(
            abi.encodePacked(req.data, req.from)
        );

        emit MetaTransactionExecuted(req.from, req.to, req.value, req.nonce, success, returnData);
    }

    function recoverSigner(bytes32 digest, bytes memory sig) internal pure returns (address) {
        if (sig.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        return ecrecover(digest, v, r, s);
    }
}
