// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ProoflyRegistry
/// @notice Lightweight onchain identity primitives for Abstract.
/// @dev Claims are intentionally user-paid; no paymaster/gasless path is included.
contract ProoflyRegistry {
    struct Badge { string name; string metadataURI; address creator; bool active; }
    struct Quest { string name; uint256 badgeId; address creator; bool active; }
    struct Battle { string name; uint256 endAt; address creator; address winner; bool settled; }

    uint256 public nextBadgeId = 1;
    uint256 public nextQuestId = 1;
    uint256 public nextBattleId = 1;
    mapping(uint256 => Badge) public badges;
    mapping(uint256 => Quest) public quests;
    mapping(uint256 => Battle) public battles;
    mapping(address => bool) public passportMinted;
    mapping(address => mapping(uint256 => bool)) public hasBadge;
    mapping(address => mapping(uint256 => bool)) public questCompleted;
    mapping(address => mapping(address => mapping(uint8 => bool))) public endorsements;
    mapping(uint256 => mapping(address => bool)) public battleJoined;
    mapping(address => uint256) public badgeCount;
    mapping(address => uint256) public questCount;
    mapping(address => uint256) public endorsementCount;

    event PassportMinted(address indexed user);
    event BadgeCreated(uint256 indexed badgeId, address indexed creator, string name);
    event BadgeClaimed(uint256 indexed badgeId, address indexed user);
    event QuestCreated(uint256 indexed questId, address indexed creator, uint256 badgeId);
    event QuestCompleted(uint256 indexed questId, address indexed user);
    event Endorsed(address indexed from, address indexed user, uint8 category);
    event BattleCreated(uint256 indexed battleId, address indexed creator, uint256 endAt);
    event BattleJoined(uint256 indexed battleId, address indexed user);
    event BattleSettled(uint256 indexed battleId, address indexed winner);

    function mintPassport() external {
        require(!passportMinted[msg.sender], "Passport already minted");
        passportMinted[msg.sender] = true;
        emit PassportMinted(msg.sender);
    }

    function createBadge(string calldata name, string calldata metadataURI) external returns (uint256 id) {
        id = nextBadgeId++;
        badges[id] = Badge(name, metadataURI, msg.sender, true);
        emit BadgeCreated(id, msg.sender, name);
    }

    function claimBadge(uint256 badgeId) external {
        require(badges[badgeId].active, "Badge inactive");
        require(!hasBadge[msg.sender][badgeId], "Already claimed");
        hasBadge[msg.sender][badgeId] = true;
        badgeCount[msg.sender]++;
        emit BadgeClaimed(badgeId, msg.sender);
    }

    function createQuest(string calldata name, uint256 badgeId) external returns (uint256 id) {
        require(badges[badgeId].active, "Badge missing");
        id = nextQuestId++;
        quests[id] = Quest(name, badgeId, msg.sender, true);
        emit QuestCreated(id, msg.sender, badgeId);
    }

    function completeQuest(uint256 questId) external {
        Quest memory quest = quests[questId];
        require(quest.active, "Quest inactive");
        require(!questCompleted[msg.sender][questId], "Quest completed");
        questCompleted[msg.sender][questId] = true;
        if (!hasBadge[msg.sender][quest.badgeId]) { hasBadge[msg.sender][quest.badgeId] = true; badgeCount[msg.sender]++; }
        questCount[msg.sender]++;
        emit QuestCompleted(questId, msg.sender);
    }

    function endorse(address user, uint8 category) external {
        require(user != address(0) && user != msg.sender, "Invalid user");
        require(!endorsements[msg.sender][user][category], "Already endorsed");
        endorsements[msg.sender][user][category] = true;
        endorsementCount[user]++;
        emit Endorsed(msg.sender, user, category);
    }

    function createBattle(string calldata name, uint256 duration) external returns (uint256 id) {
        id = nextBattleId++;
        battles[id] = Battle(name, block.timestamp + duration, msg.sender, address(0), false);
        emit BattleCreated(id, msg.sender, block.timestamp + duration);
    }

    function joinBattle(uint256 battleId) external {
        Battle memory battle = battles[battleId];
        require(battle.creator != address(0) && block.timestamp < battle.endAt, "Battle closed");
        require(!battleJoined[battleId][msg.sender], "Already joined");
        battleJoined[battleId][msg.sender] = true;
        emit BattleJoined(battleId, msg.sender);
    }

    function settleBattle(uint256 battleId, address winner) external {
        Battle storage battle = battles[battleId];
        require(msg.sender == battle.creator, "Only creator");
        require(block.timestamp >= battle.endAt && !battle.settled, "Battle not ready");
        require(battleJoined[battleId][winner], "Winner did not join");
        battle.winner = winner;
        battle.settled = true;
        emit BattleSettled(battleId, winner);
    }

    function profile(address user) external view returns (bool passport, uint256 badgesOwned, uint256 questsDone, uint256 endorsementsReceived) {
        return (passportMinted[user], badgeCount[user], questCount[user], endorsementCount[user]);
    }
}
