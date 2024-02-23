import {
    WasmAccount,
    WasmBalance,
    WasmNetwork,
    WasmPaymentLink,
    WasmTransactionDetails,
    WasmWallet,
} from '../../../pkg';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import {
    wallets as apiWallets,
    walletAccountOneA,
    walletAccountOneB,
    walletAccountThree,
    walletAccountTwoA,
    walletAccountTwoB,
} from '../fixtures/api';
import { simpleTransactions } from './transactions';

const getMockedWallet = (mocked?: Partial<WasmWallet>) => {
    return {
        addAccount: vi.fn(),
        getAccount: vi.fn(),
        getBalance: vi.fn(() => ({ confirmed: BigInt(0) }) as WasmBalance),
        getTransactions: vi.fn(() => []),
        getTransaction: vi.fn(async () => ({}) as WasmTransactionDetails),
        getFingerprint: vi.fn(() => ''),
        ...mocked,
    } as WasmWallet;
};

const getMockedWasmAccount = (mocked?: Partial<WasmAccount>) => {
    return {
        free: vi.fn(),
        hasSyncData: vi.fn(async () => true),
        owns: vi.fn(async () => false),
        getBitcoinUri: vi.fn(async () =>
            WasmPaymentLink.tryParse('bitcoin:tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h', WasmNetwork.Testnet)
        ),
        getBalance: vi.fn(async () => ({ confirmed: BigInt(0) }) as WasmBalance),
        getDerivationPath: vi.fn(async () => "84'/1'/1'/0"),
        getUtxos: vi.fn(async () => []),
        getTransactions: vi.fn(async () => []),
        getTransaction: vi.fn(async () => ({}) as WasmTransactionDetails),
        ...mocked,
    } as WasmAccount;
};

export const walletsWithAccountsWithBalanceAndTxs: WalletWithAccountsWithBalanceAndTxs[] = [
    {
        ...apiWallets[0],
        wasmWallet: getMockedWallet(),
        accounts: [
            {
                ...walletAccountOneA,
                utxos: [],
                wasmAccount: getMockedWasmAccount(),
                balance: { confirmed: BigInt(100067) } as WasmBalance,
                transactions: simpleTransactions.slice(0, 4),
            },
            {
                ...walletAccountOneB,
                utxos: [],
                wasmAccount: getMockedWasmAccount(),
                balance: { confirmed: BigInt(11783999) } as WasmBalance,
                transactions: simpleTransactions.slice(4, 8),
            },
        ],
    },
    {
        ...apiWallets[1],
        wasmWallet: getMockedWallet(),
        accounts: [
            {
                ...walletAccountTwoA,
                utxos: [],
                wasmAccount: getMockedWasmAccount(),
                balance: { confirmed: BigInt(8287263) } as WasmBalance,
                transactions: simpleTransactions.slice(8, 12),
            },
            {
                ...walletAccountTwoB,
                utxos: [],
                wasmAccount: getMockedWasmAccount(),
                balance: { confirmed: BigInt(97536) } as WasmBalance,
                transactions: simpleTransactions.slice(12, 16),
            },
        ],
    },
    {
        ...apiWallets[2],
        wasmWallet: getMockedWallet(),
        accounts: [
            {
                ...walletAccountThree,
                utxos: [],
                wasmAccount: getMockedWasmAccount(),
                balance: { confirmed: BigInt(2612374) } as WasmBalance,
                transactions: simpleTransactions.slice(16, 20),
            },
        ],
    },
];
