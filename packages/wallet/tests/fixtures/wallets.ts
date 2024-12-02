import {
    type WasmAccount,
    type WasmBalance,
    WasmNetwork,
    WasmPaymentLink,
    type WasmTransactionDetails,
    WasmWallet,
} from '@proton/andromeda';

import { type WalletChainDataByWalletId } from '../../types';
import { freeable } from '../utils/wasm';
import {
    apiWalletAccountOneA,
    apiWalletAccountOneB,
    apiWalletAccountThree,
    apiWalletAccountTwoA,
    apiWalletAccountTwoB,
    apiWalletsData,
} from './api';
import { simpleTransactions } from './transactions';

export const getMockedWallet = (mocked?: Partial<WasmWallet>): WasmWallet => {
    return {
        addAccount: vi.fn(),
        getAccount: vi.fn(),
        getBalance: vi.fn().mockResolvedValue({ confirmed: 0 } as WasmBalance),
        getTransactions: vi.fn().mockResolvedValue([]),
        getTransaction: vi.fn().mockResolvedValue(() => ({}) as WasmTransactionDetails),
        discoverAccounts: vi.fn().mockResolvedValue([]),
        getFingerprint: vi.fn(() => ''),
        clearStore: vi.fn(),
        free: vi.fn(),
        ...mocked,
    };
};

export const getMockedWasmAccount = (mocked?: Partial<WasmAccount>): WasmAccount => {
    return {
        free: vi.fn(),
        hasSyncData: vi.fn().mockReturnValue(true),
        owns: vi.fn().mockReturnValue(false),
        getNextReceiveAddress: vi
            .fn()
            .mockReturnValue(
                WasmPaymentLink.tryParse('bitcoin:tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h', WasmNetwork.Testnet)
            ),
        peekReceiveAddress: vi.fn(),
        markReceiveAddressesUsedTo: vi.fn().mockReturnValue(0),
        getBalance: vi.fn().mockResolvedValue({ confirmed: 0 } as WasmBalance),
        getDerivationPath: vi.fn().mockResolvedValue("84'/1'/1'/0"),
        getUtxos: vi.fn().mockResolvedValue([]),
        getTransactions: vi.fn().mockResolvedValue([]),
        getTransaction: vi.fn().mockResolvedValue({} as WasmTransactionDetails),
        insertUnconfirmedTransaction: vi.fn(),
        clearStore: vi.fn(),
        bumpTransactionsFees: vi.fn(),
        getAddress: vi.fn(),
        getAddresses: vi.fn(),
        ...mocked,
    };
};

const wallet0 = new WasmWallet(WasmNetwork.Testnet, apiWalletsData[0].Wallet.Mnemonic as string);
const wallet1 = new WasmWallet(WasmNetwork.Testnet, apiWalletsData[1].Wallet.Mnemonic as string);
const wallet2 = new WasmWallet(WasmNetwork.Testnet, apiWalletsData[2].Wallet.Mnemonic as string);

/**
 * Used to check UI behaviour
 */
export const walletChainDataByWalletId: WalletChainDataByWalletId = {
    [apiWalletsData[0].Wallet.ID]: {
        wallet: wallet0,
        accounts: {
            [apiWalletAccountOneA.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: { confirmed: 100067, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(0, 4).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
            [apiWalletAccountOneB.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: { confirmed: 11783999, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(4, 8).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
        },
    },
    [apiWalletsData[1].Wallet.ID]: {
        wallet: wallet1,
        accounts: {
            [apiWalletAccountTwoA.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: { confirmed: 8287263, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(8, 12).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
            [apiWalletAccountTwoB.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: { confirmed: 97536, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(12, 16).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
        },
    },
    [apiWalletsData[2].Wallet.ID]: {
        wallet: wallet2,
        accounts: {
            [apiWalletAccountThree.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: { confirmed: 2612374, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(16, 20).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
        },
    },
};

/**
 * Used to check hook behaviour
 */
export const mockedWalletChainDataByWalletId: WalletChainDataByWalletId = {
    [apiWalletsData[0].Wallet.ID]: {
        wallet: getMockedWallet({
            getBalance: vi.fn(async () =>
                freeable({
                    data: { confirmed: 100067 + 11783999, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                })
            ),
            getTransactions: vi.fn(async () =>
                freeable({ 0: simpleTransactions.slice(0, 8).map((d) => freeable({ Data: d })) })
            ),
        }),
        accounts: {
            [apiWalletAccountOneA.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: {
                                confirmed: 100067,
                                immature: 0,
                                trusted_pending: 0,
                                untrusted_pending: 0,
                            },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(0, 4).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
            [apiWalletAccountOneB.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: { confirmed: 11783999, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(4, 8).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
        },
    },
    [apiWalletsData[1].Wallet.ID]: {
        wallet: getMockedWallet({
            getBalance: vi.fn(async () =>
                freeable({
                    data: { confirmed: 8287263 + 97536, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                })
            ),
            getTransactions: vi.fn(async () =>
                freeable({ 0: simpleTransactions.slice(8, 16).map((d) => freeable({ Data: d })) })
            ),
        }),
        accounts: {
            [apiWalletAccountTwoA.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: { confirmed: 8287263, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(8, 12).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
            [apiWalletAccountTwoB.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: { confirmed: 97536, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(12, 16).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
        },
    },
    [apiWalletsData[2].Wallet.ID]: {
        wallet: getMockedWallet({
            getBalance: vi.fn(async () =>
                freeable({
                    data: { confirmed: 2612374, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                })
            ),
            getTransactions: vi.fn(async () =>
                freeable({ 0: simpleTransactions.slice(16, 20).map((d) => freeable({ Data: d })) })
            ),
        }),
        accounts: {
            [apiWalletAccountThree.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            data: { confirmed: 2612374, immature: 0, trusted_pending: 0, untrusted_pending: 0 },
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(16, 20).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "84'/1'/0'",
                poolSize: 3,
            },
        },
    },
};
