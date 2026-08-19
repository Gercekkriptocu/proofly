import { encodeFunctionData, decodeFunctionResult } from 'viem';
import { PROOFLY_ABI } from './generated/prooflyRegistry.js';

export function createProoflySdk({ provider, registryAddress }) {
  const send = async (account, functionName, args = []) => provider.request({ method: 'eth_sendTransaction', params: [{ from: account, to: registryAddress, data: encodeFunctionData({ abi: PROOFLY_ABI, functionName, args }) }] });
  const read = async (functionName, args = []) => {
    const data = await provider.request({ method: 'eth_call', params: [{ to: registryAddress, data: encodeFunctionData({ abi: PROOFLY_ABI, functionName, args }) }, 'latest'] });
    return decodeFunctionResult({ abi: PROOFLY_ABI, functionName, data });
  };
  return {
    getProfile: address => read('profile', [address]),
    mintPassport: account => send(account, 'mintPassport'),
    createBadge: (account, name, metadataURI) => send(account, 'createBadge', [name, metadataURI]),
    claimBadge: (account, badgeId) => send(account, 'claimBadge', [BigInt(badgeId)]),
    createQuest: (account, name, badgeId) => send(account, 'createQuest', [name, BigInt(badgeId)]),
    completeQuest: (account, questId) => send(account, 'completeQuest', [BigInt(questId)]),
    endorse: (account, user, category) => send(account, 'endorse', [user, Number(category)]),
    createBattle: (account, name, duration) => send(account, 'createBattle', [name, BigInt(duration)]),
    joinBattle: (account, battleId) => send(account, 'joinBattle', [BigInt(battleId)]),
    settleBattle: (account, battleId, winner) => send(account, 'settleBattle', [BigInt(battleId), winner])
  };
}
