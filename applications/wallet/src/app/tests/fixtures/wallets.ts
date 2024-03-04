import {
    WasmAccount,
    WasmBalance,
    WasmNetwork,
    WasmPaymentLink,
    WasmTransactionDetails,
    WasmWallet,
} from '@proton/andromeda';

import { WalletChainDataByWalletId } from '../../types';
import {
    apiWalletAccountOneA,
    apiWalletAccountOneB,
    apiWalletAccountThree,
    apiWalletAccountTwoA,
    apiWalletAccountTwoB,
    apiWalletsData,
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

export const walletChainDataByWalletId: WalletChainDataByWalletId = {
    [apiWalletsData[0].Wallet.ID]: {
        wallet: getMockedWallet(),
        accounts: {
            [apiWalletAccountOneA.ID]: {
                account: getMockedWasmAccount(),
                balance: { confirmed: BigInt(100067) } as WasmBalance,
                transactions: simpleTransactions.slice(0, 4),
                utxos: [],
            },
            [apiWalletAccountOneB.ID]: {
                account: getMockedWasmAccount(),
                utxos: [],
                balance: { confirmed: BigInt(11783999) } as WasmBalance,
                transactions: simpleTransactions.slice(4, 8),
            },
        },
    },
    [apiWalletsData[1].Wallet.ID]: {
        wallet: getMockedWallet(),
        accounts: {
            [apiWalletAccountTwoA.ID]: {
                account: getMockedWasmAccount(),
                utxos: [],
                balance: { confirmed: BigInt(8287263) } as WasmBalance,
                transactions: simpleTransactions.slice(8, 12),
            },
            [apiWalletAccountTwoB.ID]: {
                account: getMockedWasmAccount(),
                utxos: [],
                balance: { confirmed: BigInt(97536) } as WasmBalance,
                transactions: simpleTransactions.slice(12, 16),
            },
        },
    },
    [apiWalletsData[2].Wallet.ID]: {
        wallet: getMockedWallet(),
        accounts: {
            [apiWalletAccountThree.ID]: {
                account: getMockedWasmAccount(),
                utxos: [],
                balance: { confirmed: BigInt(2612374) } as WasmBalance,
                transactions: simpleTransactions.slice(16, 20),
            },
        },
    },
};
