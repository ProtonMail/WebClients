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
import { freeable } from '../utils/wasm';
import { simpleTransactions } from './transactions';

export const getMockedWallet = (mocked?: Partial<WasmWallet>): WasmWallet => {
    return {
        addAccount: vi.fn(),
        getAccount: vi.fn(),
        getBalance: vi.fn().mockResolvedValue({ confirmed: BigInt(0) } as WasmBalance),
        getTransactions: vi.fn().mockResolvedValue([]),
        getTransaction: vi.fn().mockResolvedValue(() => ({}) as WasmTransactionDetails),
        getFingerprint: vi.fn(() => ''),
        free: vi.fn(),
        ...mocked,
    };
};

export const getMockedWasmAccount = (mocked?: Partial<WasmAccount>): WasmAccount => {
    return {
        free: vi.fn(),
        hasSyncData: vi.fn().mockReturnValue(true),
        owns: vi.fn().mockReturnValue(false),
        getBitcoinUri: vi
            .fn()
            .mockReturnValue(
                WasmPaymentLink.tryParse('bitcoin:tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h', WasmNetwork.Testnet)
            ),
        getAddress: vi.fn(),
        getLastUnusedAddressIndex: vi.fn().mockReturnValue(0),
        getBalance: vi.fn().mockResolvedValue({ confirmed: BigInt(0) } as WasmBalance),
        getDerivationPath: vi.fn().mockResolvedValue("84'/1'/1'/0"),
        getUtxos: vi.fn().mockResolvedValue([]),
        getTransactions: vi.fn().mockResolvedValue([]),
        getTransaction: vi.fn().mockResolvedValue({} as WasmTransactionDetails),
        insertUnconfirmedTransaction: vi.fn(),
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
                            confirmed: BigInt(100067),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(0, 4).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
            },
            [apiWalletAccountOneB.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            confirmed: BigInt(11783999),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(4, 8).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
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
                            confirmed: BigInt(8287263),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(8, 12).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
            },
            [apiWalletAccountTwoB.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            confirmed: BigInt(97536),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(12, 16).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
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
                            confirmed: BigInt(2612374),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(16, 20).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
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
                    confirmed: BigInt(100067 + 11783999),
                    immature: BigInt(0),
                    trusted_pending: BigInt(0),
                    untrusted_pending: BigInt(0),
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
                            confirmed: BigInt(100067),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(0, 4).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
            },
            [apiWalletAccountOneB.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            confirmed: BigInt(11783999),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(4, 8).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
            },
        },
    },
    [apiWalletsData[1].Wallet.ID]: {
        wallet: getMockedWallet({
            getBalance: vi.fn(async () =>
                freeable({
                    confirmed: BigInt(8287263 + 97536),
                    immature: BigInt(0),
                    trusted_pending: BigInt(0),
                    untrusted_pending: BigInt(0),
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
                            confirmed: BigInt(8287263),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(8, 12).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
            },
            [apiWalletAccountTwoB.ID]: {
                account: getMockedWasmAccount({
                    getBalance: vi.fn(async () =>
                        freeable({
                            confirmed: BigInt(97536),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(12, 16).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
            },
        },
    },
    [apiWalletsData[2].Wallet.ID]: {
        wallet: getMockedWallet({
            getBalance: vi.fn(async () =>
                freeable({
                    confirmed: BigInt(2612374),
                    immature: BigInt(0),
                    trusted_pending: BigInt(0),
                    untrusted_pending: BigInt(0),
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
                            confirmed: BigInt(2612374),
                            immature: BigInt(0),
                            trusted_pending: BigInt(0),
                            untrusted_pending: BigInt(0),
                        })
                    ),
                    getTransactions: vi.fn(async () =>
                        freeable({ 0: simpleTransactions.slice(16, 20).map((d) => freeable({ Data: d })) })
                    ),
                    getUtxos: vi.fn(async () => freeable({ 0: [] })),
                }),
                scriptType: 2,
                derivationPath: "m/84'/1'/0'",
            },
        },
    },
};
