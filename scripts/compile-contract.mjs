import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

const source = fs.readFileSync(path.resolve('contracts/ProoflyRegistry.sol'), 'utf8');
const input = { language: 'Solidity', sources: { 'ProoflyRegistry.sol': { content: source } }, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } };
const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors?.some(error => error.severity === 'error')) { console.error(output.errors); process.exit(1); }
const artifact = output.contracts['ProoflyRegistry.sol'].ProoflyRegistry;
fs.mkdirSync('src/generated', { recursive: true });
fs.writeFileSync('src/generated/prooflyRegistry.js', `export const PROOFLY_ABI = ${JSON.stringify(artifact.abi)};\nexport const PROOFLY_BYTECODE = "0x${artifact.evm.bytecode.object}";\n`);
console.log(`Compiled ProoflyRegistry: ${artifact.evm.bytecode.object.length / 2} bytes`);
