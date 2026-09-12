// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WyreClassicalCorpusRegistry
 * @dev Sovereign L1 On-Chain Notarization & Manuscript Proof Ledger
 * Avalanche Subnet EVM (Chain ID: 51950)
 * Native Token: WYRE
 * 
 * Anchors the authentic classical corpus of:
 * - Imam Fakhr al-Din al-Razi (Tafsir al-Kabir, Al-Matalib al-Aliyyah)
 * - Imam Abu Hamid al-Ghazali (Ihya Ulum al-Din 40 Books, Tahafut)
 * - Imam Yahya ibn Sharaf al-Nawawi (Riyad al-Salihin, Sharh Muslim)
 * - Imam al-Raghib al-Isfahani (Al-Mufradat fi Gharib al-Quran)
 * - Classical Heritage Works (Kitab al-Shifa, Al-Futuhat al-Makkiyya)
 */
contract WyreClassicalCorpusRegistry {
    struct ManuscriptRecord {
        bytes32 contentHash;      // SHA-256 or Keccak-256 hash of EPUB binary
        string title;             // Classical title in English and transliteration
        string arabicTitle;       // Classical Arabic orthography
        string author;            // Classical scholar attribution
        string category;          // Science category (Tafsir, Kalam, Fiqh, etc.)
        string downloadUri;       // Sovereign distribution path (/epubs/...)
        string ipfsCid;           // Wasam / IPFS content identifier
        uint256 fileSizeBytes;    // Byte size
        uint256 blockHeight;      // Subnet block height when registered
        uint256 timestamp;        // Registration timestamp
        address registrar;        // DID public address
        bool isVerified;          // Proof of validation
    }

    address public immutable owner;
    uint256 public totalManuscripts;

    // contentHash -> ManuscriptRecord
    mapping(bytes32 => ManuscriptRecord) private _records;
    bytes32[] private _allHashes;

    event ManuscriptAnchored(
        bytes32 indexed contentHash,
        string title,
        string author,
        uint256 fileSizeBytes,
        uint256 blockHeight,
        address indexed registrar
    );

    event ManuscriptVerified(
        bytes32 indexed contentHash,
        bool status,
        address indexed verifier
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "WyreCorpus: Caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Registers and anchors a classical manuscript onto the L1 blockchain.
     */
    function registerManuscript(
        bytes32 contentHash,
        string calldata title,
        string calldata arabicTitle,
        string calldata author,
        string calldata category,
        string calldata downloadUri,
        string calldata ipfsCid,
        uint256 fileSizeBytes
    ) external returns (bool) {
        require(contentHash != bytes32(0), "WyreCorpus: Invalid content hash");
        require(bytes(title).length > 0, "WyreCorpus: Title required");

        bool isNew = !_records[contentHash].isVerified;
        if (isNew) {
            _allHashes.push(contentHash);
            totalManuscripts++;
        }

        _records[contentHash] = ManuscriptRecord({
            contentHash: contentHash,
            title: title,
            arabicTitle: arabicTitle,
            author: author,
            category: category,
            downloadUri: downloadUri,
            ipfsCid: ipfsCid,
            fileSizeBytes: fileSizeBytes,
            blockHeight: block.number,
            timestamp: block.timestamp,
            registrar: msg.sender,
            isVerified: true
        });

        emit ManuscriptAnchored(
            contentHash,
            title,
            author,
            fileSizeBytes,
            block.number,
            msg.sender
        );

        return true;
    }

    /**
     * @notice Batch registers multiple manuscripts in a single atomic transaction.
     */
    function batchRegisterManuscripts(
        bytes32[] calldata contentHashes,
        string[] calldata titles,
        string[] calldata authors,
        uint256[] calldata fileSizes
    ) external returns (uint256 count) {
        require(contentHashes.length == titles.length, "WyreCorpus: Array length mismatch");
        require(contentHashes.length == authors.length, "WyreCorpus: Array length mismatch");
        require(contentHashes.length == fileSizes.length, "WyreCorpus: Array length mismatch");

        for (uint256 i = 0; i < contentHashes.length; i++) {
            bytes32 hash = contentHashes[i];
            if (hash == bytes32(0)) continue;

            if (!_records[hash].isVerified) {
                _allHashes.push(hash);
                totalManuscripts++;
            }

            _records[hash] = ManuscriptRecord({
                contentHash: hash,
                title: titles[i],
                arabicTitle: "",
                author: authors[i],
                category: "Classical Heritage",
                downloadUri: "",
                ipfsCid: "",
                fileSizeBytes: fileSizes[i],
                blockHeight: block.number,
                timestamp: block.timestamp,
                registrar: msg.sender,
                isVerified: true
            });

            emit ManuscriptAnchored(hash, titles[i], authors[i], fileSizes[i], block.number, msg.sender);
            count++;
        }
    }

    /**
     * @notice Verifies whether a manuscript content hash is registered on-chain.
     */
    function verifyManuscript(bytes32 contentHash)
        external
        view
        returns (
            bool exists,
            string memory title,
            string memory author,
            uint256 blockHeight,
            uint256 timestamp
        )
    {
        ManuscriptRecord memory rec = _records[contentHash];
        if (rec.isVerified) {
            return (true, rec.title, rec.author, rec.blockHeight, rec.timestamp);
        }
        return (false, "", "", 0, 0);
    }

    /**
     * @notice Returns the full metadata record of an anchored manuscript.
     */
    function getManuscript(bytes32 contentHash) external view returns (ManuscriptRecord memory) {
        require(_records[contentHash].isVerified, "WyreCorpus: Manuscript not found");
        return _records[contentHash];
    }

    /**
     * @notice Returns all anchored manuscript hashes.
     */
    function getAllHashes() external view returns (bytes32[] memory) {
        return _allHashes;
    }
}
