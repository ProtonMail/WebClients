import { WasmBalance } from '../../../pkg';
import { Wallet, WalletKind, WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { ScriptType, WalletPassphrase, WalletSetupMode, WalletStatus, WalletType } from '../../types/api';
import { wallets as apiWallets } from '../fixtures/api';
import { simpleTransactions } from './transactions';

export const wallets: Wallet[] = [
    { kind: WalletKind.LIGHTNING, name: 'lightning 01', id: '0', balance: 100067 },
    { kind: WalletKind.ONCHAIN, name: 'Bitcoin 01', id: '1', balance: 11783999 },
    { kind: WalletKind.ONCHAIN, name: 'Bitcoin 02', id: '2', balance: 97536 },
    { kind: WalletKind.ONCHAIN, name: 'Bitcoin 03', id: '3', balance: 8287263 },
    { kind: WalletKind.LIGHTNING, name: 'Lightning 02', id: '4', balance: 2612374 },
];

export const walletsWithAccountsWithBalanceAndTxs: WalletWithAccountsWithBalanceAndTxs[] = [
    {
        ...apiWallets[0],
        accounts: [
            {
                ...apiWallets[0].accounts[0],
                balance: { confirmed: BigInt(100067) } as WasmBalance,
                transactions: simpleTransactions.slice(0, 4),
            },
            {
                ...apiWallets[0].accounts[1],
                balance: { confirmed: BigInt(11783999) } as WasmBalance,
                transactions: simpleTransactions.slice(4, 8),
            },
        ],
    },
    {
        ...apiWallets[1],
        accounts: [
            {
                ...apiWallets[1].accounts[0],
                balance: { confirmed: BigInt(8287263) } as WasmBalance,
                transactions: simpleTransactions.slice(8, 12),
            },
            {
                ...apiWallets[1].accounts[1],
                balance: { confirmed: BigInt(97536) } as WasmBalance,
                transactions: simpleTransactions.slice(12, 16),
            },
        ],
    },
    {
        ...apiWallets[2],
        accounts: [
            {
                ...apiWallets[2].accounts[0],
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
        accounts: [
            {
                balance: { confirmed: BigInt(8875342) } as WasmBalance,
                transactions: [],
                WalletAccountID: 15,
                WalletID: 3,
                Index: 0,
                Label: 'Account 1',
                ScriptType: ScriptType.NativeSegwit,
                CreateTime: 1701139393899,
                ModifyTime: 1701139393899,
            },
        ],
    },
];
