import React, { useEffect, useMemo, useState } from 'react';
import { encodeFunctionData, decodeFunctionResult } from 'viem';
import { PROOFLY_ABI, PROOFLY_BYTECODE } from './generated/prooflyRegistry.js';
import './protocol.css';
import { DEPLOYED_REGISTRY_ADDRESS, DEPLOYMENT } from './deployed.js';

const short = value => value ? `${value.slice(0, 6)}...${value.slice(-4)}` : '—';
const call = (abi, functionName, args = []) => encodeFunctionData({ abi, functionName, args });

async function receipt(provider, hash) {
  for (let i = 0; i < 45; i++) {
    const result = await provider.request({ method: 'eth_getTransactionReceipt', params: [hash] });
    if (result) { if (result.status === '0x0') throw new Error('Transaction reverted'); return result; }
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
  throw new Error('Transaction confirmation timed out');
}

function ProtocolPanel() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState('');
  const [registry, setRegistry] = useState(localStorage.getItem('prooflyRegistry') || DEPLOYED_REGISTRY_ADDRESS || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Connect a wallet, then deploy or paste your ProoflyRegistry address.');
  const [profile, setProfile] = useState(null);
  const [badgeName, setBadgeName] = useState('Genesis Explorer');
  const [badgeUri, setBadgeUri] = useState('ipfs://proofly/genesis-explorer');
  const [badgeId, setBadgeId] = useState('1');
  const [questName, setQuestName] = useState('Explore an Abstract app');
  const [questBadgeId, setQuestBadgeId] = useState('1');
  const [questId, setQuestId] = useState('1');
  const [endorseUser, setEndorseUser] = useState('');
  const [category, setCategory] = useState('1');
  const [battleName, setBattleName] = useState('Season 01 · Explorer race');
  const [battleId, setBattleId] = useState('1');
  const [battleDuration, setBattleDuration] = useState('604800');

  const connected = useMemo(() => Boolean(provider && account), [provider, account]);
  const action = async (functionName, args = []) => {
    if (!provider || !account) throw new Error('Connect wallet first');
    if (!registry) throw new Error('Deploy or set a registry address first');
    const hash = await provider.request({ method: 'eth_sendTransaction', params: [{ from: account, to: registry, data: call(PROOFLY_ABI, functionName, args) }] });
    setMessage(`Waiting for ${functionName}… ${hash.slice(0, 10)}…`); await receipt(provider, hash); setMessage(`${functionName} confirmed on Abstract.`); await readProfile();
  };
  const deploy = async () => {
    if (!provider || !account) throw new Error('Connect wallet first');
    const hash = await provider.request({ method: 'eth_sendTransaction', params: [{ from: account, data: PROOFLY_BYTECODE }] });
    setMessage('Deploying ProoflyRegistry…'); const result = await receipt(provider, hash); setRegistry(result.contractAddress); localStorage.setItem('prooflyRegistry', result.contractAddress); setMessage(`Registry deployed at ${short(result.contractAddress)}.`);
  };
  const run = async operation => { setBusy(true); try { await operation(); } catch (error) { setMessage(error.message || 'Transaction failed.'); } finally { setBusy(false); } };
  const connect = async () => { if (!window.ethereum) throw new Error('No browser wallet found'); const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }); setProvider(window.ethereum); setAccount(accounts[0]); setMessage(`Connected ${short(accounts[0])}.`); };
  const readProfile = async () => { if (!provider || !account || !registry) return; const data = await provider.request({ method: 'eth_call', params: [{ to: registry, data: call(PROOFLY_ABI, 'profile', [account]) }, 'latest'] }); setProfile(decodeFunctionResult({ abi: PROOFLY_ABI, functionName: 'profile', data })); };
  useEffect(() => { if (provider && account && registry) readProfile(); }, [provider, account, registry]);
  const publicProfile = account ? `${window.location.origin}${window.location.pathname}?address=${account}` : window.location.href;
  const shareX = () => window.open(`https://x.com/intent/post?text=${encodeURIComponent(`My Proofly passport on Abstract ${short(account)} ✦`)}&url=${encodeURIComponent(publicProfile)}&hashtags=Proofly,Abstract`, '_blank', 'noopener,noreferrer');

  return <section className="protocol-panel">
    <div className="section-heading"><div><div className="eyebrow">PROOFLY PROTOCOL</div><h2>Make your proof composable.</h2></div><button className="ghost-button" onClick={() => run(connect)}>Connect wallet</button></div>
    <p className="protocol-lede">Passport, claims, quests, social proof and battles — each action creates a real user-signed transaction on Abstract. No gas sponsorship is included.</p>
    <div className="protocol-status"><span className={connected ? 'green-dot' : 'orange-dot'} /> {message} <a href={DEPLOYMENT.explorer} target="_blank" rel="noreferrer">Open deployed registry ↗</a></div>
    <div className="protocol-config"><input value={registry} onChange={event => { setRegistry(event.target.value); localStorage.setItem('prooflyRegistry', event.target.value); }} placeholder="ProoflyRegistry contract address" /><button className="primary-button" disabled={busy} onClick={() => run(deploy)}>Deploy Registry</button></div>
    <div className="protocol-grid">
      <article className="protocol-card passport-card"><div className="eyebrow">01 · PASSPORT</div><h3>Your onchain identity</h3><p>Mint once, then carry your Proofly identity across Abstract apps.</p><button className="primary-button" disabled={busy || !registry} onClick={() => run(() => action('mintPassport'))}>Mint passport ↗</button>{profile && <div className="mini-stats"><span>Passport <b>{profile[0] ? 'YES' : 'NO'}</b></span><span>Badges <b>{profile[1].toString()}</b></span><span>Quests <b>{profile[2].toString()}</b></span></div>}</article>
      <article className="protocol-card"><div className="eyebrow">02 · CREATOR DROP</div><h3>Create a badge</h3><input value={badgeName} onChange={event => setBadgeName(event.target.value)} placeholder="Badge name" /><input value={badgeUri} onChange={event => setBadgeUri(event.target.value)} placeholder="Metadata URI" /><button className="ghost-button" disabled={busy || !registry} onClick={() => run(() => action('createBadge', [badgeName, badgeUri]))}>Create badge ↗</button></article>
      <article className="protocol-card"><div className="eyebrow">03 · CLAIM</div><h3>Claim verified badge</h3><input value={badgeId} onChange={event => setBadgeId(event.target.value)} placeholder="Badge ID" /><button className="ghost-button" disabled={busy || !registry} onClick={() => run(() => action('claimBadge', [BigInt(badgeId || 1)]))}>Claim badge ↗</button></article>
      <article className="protocol-card"><div className="eyebrow">04 · QUEST</div><h3>Quest board</h3><input value={questName} onChange={event => setQuestName(event.target.value)} placeholder="Quest name" /><input value={questBadgeId} onChange={event => setQuestBadgeId(event.target.value)} placeholder="Reward badge ID" /><button className="ghost-button" disabled={busy || !registry} onClick={() => run(() => action('createQuest', [questName, BigInt(questBadgeId || 1)]))}>Create quest ↗</button><input value={questId} onChange={event => setQuestId(event.target.value)} placeholder="Quest ID" /><button className="primary-button" disabled={busy || !registry} onClick={() => run(() => action('completeQuest', [BigInt(questId || 1)]))}>Complete quest ↗</button></article>
      <article className="protocol-card"><div className="eyebrow">05 · ENDORSEMENT</div><h3>Peer proof</h3><input value={endorseUser} onChange={event => setEndorseUser(event.target.value)} placeholder="0x recipient" /><input value={category} onChange={event => setCategory(event.target.value)} placeholder="Category 1–8" /><button className="ghost-button" disabled={busy || !registry} onClick={() => run(() => action('endorse', [endorseUser, Number(category || 1)]))}>Endorse user ↗</button></article>
      <article className="protocol-card"><div className="eyebrow">06 · PROOF BATTLE</div><h3>Seasonal competition</h3><input value={battleName} onChange={event => setBattleName(event.target.value)} placeholder="Battle name" /><input value={battleDuration} onChange={event => setBattleDuration(event.target.value)} placeholder="Duration in seconds" /><button className="ghost-button" disabled={busy || !registry} onClick={() => run(() => action('createBattle', [battleName, BigInt(battleDuration || 604800)]))}>Create battle ↗</button><input value={battleId} onChange={event => setBattleId(event.target.value)} placeholder="Battle ID" /><button className="primary-button" disabled={busy || !registry} onClick={() => run(() => action('joinBattle', [BigInt(battleId || 1)]))}>Join battle ↗</button></article>
    </div>
    <div className="protocol-footer"><div><div className="eyebrow">PUBLIC PASSPORT</div><p>{account ? short(account) : 'Connect to generate your profile link'}</p></div><div className="protocol-footer-actions"><button className="ghost-button" onClick={() => navigator.clipboard?.writeText(publicProfile)}>Copy public link</button><button className="ghost-button" disabled={!account} onClick={shareX}>Share on X 𝕏</button></div></div>
    <details className="sdk-details"><summary>Developer SDK surface</summary><pre>{`const profile = await proofly.getProfile(address);\nawait proofly.claimBadge({ badgeId: 1 });\nawait proofly.completeQuest({ questId: 1 });\nawait proofly.endorse({ user: address, category: 1 });`}</pre></details>
  </section>;
}

export { ProtocolPanel };
