const assert = require('node:assert/strict');
const { mkdtemp, readFile, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { afterEach, beforeEach, test } = require('node:test');
const { JsonStorageService } = require('../dist/common/storage/json-storage.service');
const { WalletService } = require('../dist/wallet/wallet.service');

let originalCwd;
let directory;
let storage;
let walletService;

beforeEach(async () => {
  originalCwd = process.cwd();
  directory = await mkdtemp(join(tmpdir(), 'token-wallet-atomic-'));
  process.chdir(directory);
  storage = new JsonStorageService();
  walletService = new WalletService(storage);
  await walletService.initialize();
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(directory, { recursive: true, force: true });
});

async function readWallet() {
  return JSON.parse(await readFile(join(directory, 'data/wallet.json'), 'utf8'));
}

async function readLedger() {
  return JSON.parse(await readFile(join(directory, 'data/transactions.json'), 'utf8'));
}

test('credit and redemption commit wallet, ledger, and idempotency together', async () => {
  const credit = await walletService.credit({ amount: 500 }, '10000000-0000-4000-8000-000000000001');
  const redeem = await walletService.redeem({ amount: 300 }, '10000000-0000-4000-8000-000000000002');
  assert.equal((await readWallet()).tokenBalance, 1_200);
  const ledger = await readLedger();
  assert.equal(ledger.length, 3);
  assert.equal(ledger[1].idempotency.key, '10000000-0000-4000-8000-000000000001');
  assert.equal(ledger[2].balanceAfter, 1_200);
  assert.equal(credit.wallet.tokenBalance, 1_500);
  assert.equal(redeem.wallet.tokenBalance, 1_200);
});

for (const failedDestination of ['wallet.json', 'transactions.json']) {
  test(`rolls back both files when replacing ${failedDestination} fails`, async () => {
    const realReplace = storage.replaceFile.bind(storage);
    let shouldFail = true;
    storage.replaceFile = async (source, destination) => {
      if (shouldFail && destination.endsWith(failedDestination)) {
        shouldFail = false;
        throw new Error('simulated rename failure');
      }
      return realReplace(source, destination);
    };

    await assert.rejects(walletService.credit({ amount: 50 }, '20000000-0000-4000-8000-000000000001'));
    assert.equal((await readWallet()).tokenBalance, 1_000);
    assert.equal((await readLedger()).length, 1);
    assert.equal(await readFile(join(directory, 'data/transaction-journal.json')).then(() => true, () => false), false);

    const retry = await walletService.credit({ amount: 50 }, '20000000-0000-4000-8000-000000000001');
    assert.equal(retry.wallet.tokenBalance, 1_050);
    assert.equal((await readLedger()).length, 2);
  });
}

test('startup restores previous files after an interrupted prepared transaction', async () => {
  const walletPath = join(directory, 'data/wallet.json');
  const ledgerPath = join(directory, 'data/transactions.json');
  const oldWallet = await readFile(walletPath, 'utf8');
  const oldLedger = await readFile(ledgerPath, 'utf8');
  await writeFile(walletPath, JSON.stringify({ id: 1, name: 'Demo User', tokenBalance: 950 }));
  await writeFile(ledgerPath, JSON.stringify([{ id: 'partial', type: 'credit' }]));
  await writeFile(join(directory, 'data/transaction-journal.json'), JSON.stringify({
    status: 'prepared', previous: { 'wallet.json': oldWallet, 'transactions.json': oldLedger }, createdAt: new Date().toISOString(),
  }));

  await new JsonStorageService().onModuleInit();
  assert.equal((await readWallet()).tokenBalance, 1_000);
  assert.equal((await readLedger()).length, 1);
});

test('keeps files for a commit marker and removes its journal at startup', async () => {
  const walletPath = join(directory, 'data/wallet.json');
  const ledgerPath = join(directory, 'data/transactions.json');
  const committedWallet = { id: 1, name: 'Demo User', tokenBalance: 1_050 };
  const committedLedger = [{ id: 'committed', type: 'credit', amount: 50 }];
  await writeFile(walletPath, JSON.stringify(committedWallet));
  await writeFile(ledgerPath, JSON.stringify(committedLedger));
  await writeFile(join(directory, 'data/transaction-journal.json'), JSON.stringify({
    status: 'committed', previous: { 'wallet.json': '{"tokenBalance":1000}', 'transactions.json': '[]' }, createdAt: new Date().toISOString(),
  }));

  await new JsonStorageService().onModuleInit();
  assert.deepEqual(await readWallet(), committedWallet);
  assert.deepEqual(await readLedger(), committedLedger);
  await assert.rejects(readFile(join(directory, 'data/transaction-journal.json')));
});

test('concurrent duplicate requests commit exactly once', async () => {
  const key = '30000000-0000-4000-8000-000000000001';
  const results = await Promise.all(Array.from({ length: 12 }, () => walletService.credit({ amount: 25 }, key)));
  assert.equal((await readWallet()).tokenBalance, 1_025);
  assert.equal((await readLedger()).length, 2);
  assert.ok(results.every((result) => result.transaction.id === results[0].transaction.id));
});

test('concurrent credit and redemption use the latest committed balance', async () => {
  await Promise.all([
    walletService.credit({ amount: 500 }, '40000000-0000-4000-8000-000000000001'),
    walletService.redeem({ amount: 300 }, '40000000-0000-4000-8000-000000000002'),
  ]);
  assert.equal((await readWallet()).tokenBalance, 1_200);
  const ledger = await readLedger();
  assert.equal(ledger.length, 3);
  assert.equal(ledger[2].balanceAfter, 1_200);
});
