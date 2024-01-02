import {
    WasmAccount,
    WasmBalance,
    WasmDetailledTransaction,
    WasmNetwork,
    WasmPaymentLink,
    WasmScriptType,
    WasmWallet,
} from '../../../pkg';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { WalletPassphrase, WalletSetupMode, WalletStatus, WalletType } from '../../types/api';
import { wallets as apiWallets } from '../fixtures/api';
import { simpleTransactions } from './transactions';

const getMockedWallet = (mocked?: Partial<WasmWallet>) => {
    return {
        addAccount: vi.fn(),
        getAccount: vi.fn(),
        getBalance: vi.fn(() => ({ confirmed: BigInt(0) }) as WasmBalance),
        getTransactions: vi.fn(() => []),
        getTransaction: vi.fn(async () => ({}) as WasmDetailledTransaction),
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
        getTransaction: vi.fn(async () => ({}) as WasmDetailledTransaction),
        ...mocked,
    } as WasmAccount;
};

export const walletsWithAccountsWithBalanceAndTxs: WalletWithAccountsWithBalanceAndTxs[] = [
    {
        ...apiWallets[0],
        wasmWallet: getMockedWallet(),
        accounts: [
            {
                ...apiWallets[0].accounts[0],
                utxos: [],
                wasmAccount: getMockedWasmAccount(),
                balance: { confirmed: BigInt(100067) } as WasmBalance,
                transactions: simpleTransactions.slice(0, 4),
            },
            {
                ...apiWallets[0].accounts[1],
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
                ...apiWallets[1].accounts[0],
                utxos: [],
                wasmAccount: getMockedWasmAccount(),
                balance: { confirmed: BigInt(8287263) } as WasmBalance,
                transactions: simpleTransactions.slice(8, 12),
            },
            {
                ...apiWallets[1].accounts[1],
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
                ...apiWallets[2].accounts[0],
                utxos: [],
                wasmAccount: getMockedWasmAccount(),
                balance: { confirmed: BigInt(2612374) } as WasmBalance,
                transactions: simpleTransactions.slice(16, 20),
            },
        ],
    },

    // FAKE LN WALLET. TODO: change this when LN support comes up
    {
        WalletID: 3,
        UserID: 999,
        Name: 'Lightning 01',
        Mnemonic:
            'category law logic swear involve banner pink room diesel fragile sunset remove whale lounge captain code hobby lesson material current moment funny vast fade',
        Passphrase: WalletPassphrase.WithoutPassphrase,
        Imported: WalletSetupMode.Created,
        Priority: 1,
        Status: WalletStatus.Active,
        // Here -> use Lightning type to check UI and balance
        Type: WalletType.Lightning,
        CreateTime: 1701149748899,
        ModifyTime: 1701169836899,
        wasmWallet: getMockedWallet(),
        accounts: [
            {
                balance: { confirmed: BigInt(8875342) } as WasmBalance,
                transactions: [],
                WalletAccountID: 15,
                WalletID: 3,
                Index: 0,
                Label: 'Account 1',
                ScriptType: WasmScriptType.NativeSegwit,
                CreateTime: 1701139393899,
                ModifyTime: 1701139393899,
                utxos: [],
                wasmAccount: getMockedWasmAccount(),
            },
        ],
    },
];
