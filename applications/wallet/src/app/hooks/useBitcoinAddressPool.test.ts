import { renderHook } from '@testing-library/react-hooks';
import { noop } from 'lodash';
import { MockedFunction } from 'vitest';

import {
    WasmAccount,
    WasmApiWalletBitcoinAddresses,
    WasmBitcoinAddressClient,
    WasmDerivationPath,
    WasmWallet,
} from '@proton/andromeda';
import { WasmNetwork } from '@proton/andromeda';
import { WasmScriptType } from '@proton/andromeda';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { mockUseNotifications, mockUseUserKey } from '@proton/testing/lib/vitest';

import { useGetBitcoinAddressHighestIndex } from '../store/hooks/useBitcoinAddressHighestIndex';
import { mockUseWalletApi } from '../tests';
import { pgpPrvKey } from '../tests/fixtures/keys';
import { mockUseGetBitcoinAddressHighestIndex } from '../tests/mocks/useBitcoinAddressHighestIndex';
import { useBitcoinAddressPool } from './useBitcoinAddressPool';

const mockedPushBitcoinAddressesCreationPayload = vi.fn();
vi.mock('@proton/andromeda', async (importOriginal) => {
    const mod = await importOriginal<typeof import('@proton/andromeda')>();
    return {
        ...mod,
        WasmApiBitcoinAddressesCreationPayload: vi.fn(() => ({
            key: 'mocked_payload',
            push: mockedPushBitcoinAddressesCreationPayload,
        })),
    };
});
vi.mock('../constants/email-integration', () => ({ POOL_FILLING_THRESHOLD: 3 }));

const getUserKeys = async () => {
    const key1 = await CryptoProxy.importPrivateKey({ armoredKey: pgpPrvKey, passphrase: 'testtest' });

    const userKeys: DecryptedKey[] = [
        {
            privateKey: key1,
            publicKey: key1,
            ID: 'WALLET_TEST',
        },
    ];

    return userKeys;
};

const expectSignedBy = async (k: DecryptedKey, a?: string, w?: string) => {
    expect(a).toBeTruthy();
    expect(w).toBeTruthy();

    const { verified } = await CryptoProxy.verifyMessage({
        armoredSignature: w,
        textData: a,
        verificationKeys: [k.publicKey],
    });
    expect(verified).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID);
};

const wallet = {
    Wallet: {
        ID: '01',
        Name: 'Test wallet',
        IsImported: 0,
        Priority: 0,
        Type: 0,
        HasPassphrase: 0,
        Status: 0,
        // encrypted with wallet key defined below
        // category law logic swear involve banner pink room diesel fragile sunset remove whale lounge captain code hobby lesson material current moment funny vast fade
        Mnemonic:
            '4mJqR8O0XNsvkUpA+O9W+cMco/iS/IE5Gt7Bp1eqYyd4Y7Ty7iuIGJDaBMO9PkUrPW/KetHuJPN/Q/VMNqRTih9NXM1BkvAee2n+smwwNME3YmAqkhbPG8c5/c1k/X1ghOxdcfji0P/jhhyJvOwWCWTbZiZaOuN2VDdVtVaGSCNwwvV8Gb8KASS/b3e5i3h37n8dQXwu3b7cyvEpZQYrYzEkK71/GmuZBJYeexBscCNeOiGp5cZ+Oac=',
        Fingerprint: '',
        PublicKey: null,
        Passphrase: '',
    },
    WalletAccounts: [
        {
            ID: '001',
            WalletID: '01',
            Label: 'Account 1',
            ScriptType: WasmScriptType.NativeSegwit,
            DerivationPath: "m/84'/1'/0'",
            Addresses: [{ ID: '0000001', Email: 'pro@proton.black' }],
        },
    ],
    WalletKey: {
        WalletID: '01',
        UserKeyID: '',
        // encrypted with key in tests/fixtures/keys.ts
        // 195, 144, 231, 166, 130, 1, 110, 215, 117, 236, 57, 29, 47, 122, 226, 13, 195, 81, 179, 248, 126, 86, 0, 117, 231, 51, 20, 99, 99, 102, 146, 36
        WalletKey:
            'wcBMA5fAXxAlQaycAQf/QUHd1dN32croM9sPR/rF53JFie2ZKEEw88Uj77VnUUhuzv1dgRTKNiUHaFNfd7m/r5xLOqEGiPQCPAt4MhHbgwilrxu52Jqq3xh2ErBIgYnRM+WNvAkzZK6PMVJhppx3ciiCMMkBkB3iaaunAtXssZzzdAPPC/+TNEyh1ugQKgKhx+Ov/ygoPSXwDS+DvwtOQX0O6OMCrvixhHMiYJg8EBSc6+DM06N28A9t4UsECqE/2VwLfYfcFMgXQVIhedvKbu2GD18S2K4d1t5ycDVXCoIvB45OjjovpLaLw205TiMmXX6TW5XJho/RaXnqPjkDC01PoTbMZbbN4OhelZ+wmtLA1gFnTJmSkkAhT/S62cm8eVJRLKMnRqMYDRGYKDZkBOk5XWkZiKl7/5MftfKV4WqdGu8htj3MiJkFEdLAo7ARzkzf1Mz6ab1lhI5j/uy1bYriNk1AjGPfsk0RMotad/Zb93F7YPRL3ol2h8kLMjPDtqtIDYG8HjavtS639tD2N0tLsnxekA/miwDAeMuAZDEPT9tuzkiMMfM8wyCtKpBVDOfM1DnH/9v+XTFit/EqBh9F/6x3KUtHikFffq7hrITZf2xCG9aFgR2UFNYi7r4i97lhsN6XkbItmAYzYEIrTDuvq8+ionBfiS5NDqkqq1LP8eJjwDb1b4mxvhLeVm2zELbNtuX5ClCU3qi5o++aRP1BTp+yFWDJOrONEu8zPpsw/JJWb0JjZ9F6nCZXs/D4ankiCfHjIt1ONC3u7JTmFeDBeL7PdYtwVMEkrFTEl4DOUmegW0k+VdWMLHNOTGr0NR1xJeC+rcJFN9neaAEakyutHrGnzSIn8wKNALzt/u4HF7NFTYuBEoUKjTZ49vMYKNrqzDTUX9Q=',
    },
    WalletSettings: {
        WalletID: '01',
        HideAccounts: 0,
        InvoiceDefaultDescription: null,
        InvoiceExpirationTime: 0,
        MaxChannelOpeningFee: 0,
    },
    IsNotDecryptable: false,
};

const addresses = [
    [
        {
            Data: {
                ID: '00001',
                WalletID: '01',
                WalletAccountID: '001',
                Fetched: 0,
                Used: 0,
                BitcoinAddress: 'tb1pv36jv053lqqxkr3y605mh0x78vren6fh0d2l2w5wn4l77kyxfk7qsumq0n',
                BitcoinAddressSignature:
                    '-----BEGIN PGP MESSAGE-----\nVersion: Keybase OpenPGP v2.0.76\nComment: https://keybase.io/crypto\n\nyMDAAnicAXQBi/7EDQMACgHhMIviBGORUgHLRHUAZhfpZnRiMXB2MzZqdjA1M2xx\ncXhrcjN5NjA1bWgweDc4dnJlbjZmaDBkMmwydzV3bjRsNzdreXhmazdxc3VtcTBu\nwsBcBAABCgAGBQJmF+lmAAoJEOEwi+IEY5FSDMMIALqU0jqx7Z45WTr9jDUigLoP\nRCkk9X2zjyc6xllpdK7mARFpmafTThz+Da2RfMcxgV7qGeZ/zM3fmz5bO6VPZb/w\n6c+i6ncW4eotsvfPiI329GMjjhpJ9yUlTE3k8IWoL90f5bP1wJ/ORr/bF2rMcRIE\n0fjkTCtJ/wCTSW0tuhkjaVZ9CpjPDV7DRlm1iZHnIFoExIoR6oPbrlWrDb4Favqv\n47Fw6KfvywYxabITghNYkk0psi05p1h1AtRGG7h1hUQO9208jYhw2/ZjwcSwmX4I\nWD5SPhrMPgwce3bXmF0DeXoVaQOkv3x8iVUwDUsfObWb5jpfwtomwi43wm33Ipg7\nB6Mn\n=cfap\n-----END PGP MESSAGE-----',
                BitcoinAddressIndex: 0,
            },
            free: noop,
        },
        {
            Data: {
                ID: '00002',
                WalletID: '01',
                WalletAccountID: '001',
                Fetched: 0,
                Used: 0,
                BitcoinAddress: 'tb1pv36jv053lqqxkr3y605mh0x78vren6fh0d2l2w5wn4l77kyxfk7qsumq0n',
                BitcoinAddressSignature:
                    '-----BEGIN PGP MESSAGE-----\nVersion: Keybase OpenPGP v2.0.76\nComment: https://keybase.io/crypto\n\nyMDAAnicAXQBi/7EDQMACgHhMIviBGORUgHLRHUAZhfq4nRiMXB2MzZqdjA1M2xx\ncXhrcjN5NjA1bWgweDc4dnJlbjZmaDBkMmwydzV3bjRsNzdreXhmazdxc3VtcTBu\nwsBcBAABCgAGBQJmF+riAAoJEOEwi+IEY5FSGHMIALENY25SRTATfEjz7+HDkQWc\nlfb0rYbZMUz63QrbXpSrqD+NjwnVWk55Qs6ZfrqzNlzkhqOQB47gAwrZrP1C3sjh\nnu0I4v851qsJ9BEMFBAuqoqS2sk1TlV7Iu1pKa9IKSrCW3YBppipy9njesDzqQJb\ngjHStlmALnvWST2TldGbtnzkihLBL90kELlSRYadgCrhNwu4D/Rve58ocjG16h2x\nP/Cw+24ui+sIOf0V9leKD04B1dd3ipj87fM2mQlnFC3L6R6bsWGuxU4VzPeJW1IV\n3x9/KWPkUP6m/kKg8DOfQEZ3KrdJ/4NJSfu2kDeA1JUE8bIIb4+gnnMS5KpqT8a5\nLqlU\n=Wd7Y\n-----END PGP MESSAGE-----',
                BitcoinAddressIndex: 1,
            },
            free: noop,
        },
        {
            Data: {
                ID: '00003',
                WalletID: '01',
                WalletAccountID: '001',
                Fetched: 0,
                Used: 0,
                BitcoinAddress: 'tb1qtysxx7zkmm5nwy0hv2mjxfrermsry2vjsygg0eqawwwp6gy4hl4s2tudtw',
                BitcoinAddressSignature:
                    '-----BEGIN PGP MESSAGE-----\nVersion: Keybase OpenPGP v2.0.76\nComment: https://keybase.io/crypto\n\nyMDAAnicAXQBi/7EDQMACgHhMIviBGORUgHLRHUAZhfrJXRiMXF0eXN4eDd6a21t\nNW53eTBodjJtanhmcmVybXNyeTJ2anN5Z2cwZXFhd3d3cDZneTRobDRzMnR1ZHR3\nwsBcBAABCgAGBQJmF+slAAoJEOEwi+IEY5FS4MIIAIZGNZY7DWBqaa8hsMtsoTAT\n29FogZMgCUlMdHUDyZv5awlQjZoxc+rFpQaQlEM/gpikuillWyfCyzGTB+CxCi+/\nANvtHshm/lZo5NuwHpNK+FTAy/HKoNM2sWpPHzPeTnedsQl8GbLiK0zfVGnnvcIw\nJe+ZtTkMoA6BaOhep8E+4jYzjaGLmICRL9czu5cjANCdjrCVKOb9k7Fwwqmf9PoJ\n4NapMSJnDrzuuWoMXOuusvhwy6T037YnMhl3BJYpipFXtIFF6+VvcnNLDwvLwE0y\n/mUIsmLnrLMKzBruuke9U6n0ZjJAqwZC6kUZ24Ad4Ff6vb6oDZpBuiLzfoeEVZhE\nQqpM\n=DQlz\n-----END PGP MESSAGE-----',
                BitcoinAddressIndex: 2,
            },
            free: noop,
        },
    ],
] as unknown as WasmApiWalletBitcoinAddresses;

let baseArgs: Parameters<typeof useBitcoinAddressPool>[0];

describe('useBitcoinAddressPool', () => {
    let userKeys: DecryptedKey[];

    const mockedGetBitcoinAddressHighestIndex: MockedFunction<ReturnType<typeof useGetBitcoinAddressHighestIndex>> =
        vi.fn();
    const mockedGetBitcoinAddresses: MockedFunction<WasmBitcoinAddressClient['getBitcoinAddresses']> = vi.fn();
    const mockedAddBitcoinAddresses: MockedFunction<WasmBitcoinAddressClient['addBitcoinAddress']> = vi.fn();
    const mockedUpdateBitcoinAddress: MockedFunction<WasmBitcoinAddressClient['updateBitcoinAddress']> = vi.fn();

    let wasmAccount: WasmAccount;

    beforeAll(async () => {
        await CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());

        userKeys = await getUserKeys();
        mockUseUserKey([userKeys]);
    });

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    beforeEach(() => {
        mockUseNotifications();

        mockUseGetBitcoinAddressHighestIndex();

        mockedGetBitcoinAddressHighestIndex.mockResolvedValue(0);
        mockUseGetBitcoinAddressHighestIndex(mockedGetBitcoinAddressHighestIndex);

        const wasmWallet = new WasmWallet(
            WasmNetwork.Testnet,
            'category law logic swear involve banner pink room diesel fragile sunset remove whale lounge captain code hobby lesson material current moment funny vast fade'
        );

        wasmAccount = new WasmAccount(
            wasmWallet,
            WasmScriptType.NativeSegwit,
            WasmDerivationPath.fromString("m/84'/1'/0'")
        );

        baseArgs = {
            decryptedApiWalletsData: [wallet],
            walletsChainData: {
                '01': {
                    wallet: wasmWallet,
                    accounts: {
                        '001': {
                            account: wasmAccount,
                            derivationPath: "m/84'/1'/0'",
                            syncId: '1',
                            scriptType: 2,
                        },
                    },
                },
            },
        };

        mockUseWalletApi({
            bitcoin_address: {
                getBitcoinAddresses: mockedGetBitcoinAddresses,
                addBitcoinAddress: mockedAddBitcoinAddresses,
                updateBitcoinAddress: mockedUpdateBitcoinAddress,
            },
        });

        mockedGetBitcoinAddresses.mockResolvedValue(addresses);
    });

    afterEach(() => {
        mockedGetBitcoinAddressHighestIndex.mockReset();
        mockedGetBitcoinAddresses.mockReset();
        mockedAddBitcoinAddresses.mockReset();
        mockedUpdateBitcoinAddress.mockReset();
        mockedPushBitcoinAddressesCreationPayload.mockReset();
    });

    it('should ask for highest index for each wallet account', async () => {
        wasmAccount.getLastUnusedAddressIndex = vi.fn().mockReturnValue(7);

        const { result } = renderHook(() => useBitcoinAddressPool(baseArgs));
        await result.current.fillPool();

        expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledTimes(1);
        expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledWith('01', '001');

        expect(wasmAccount.getLastUnusedAddressIndex).toHaveBeenCalledTimes(1);
        expect(wasmAccount.getLastUnusedAddressIndex).toHaveBeenCalledWith();
    });

    describe('when wallet account has no email address set', () => {
        it('should not perform any call', () => {
            renderHook(() =>
                useBitcoinAddressPool({
                    ...baseArgs,
                    decryptedApiWalletsData: [
                        { ...wallet, WalletAccounts: [{ ...wallet.WalletAccounts[0], Addresses: [] }] },
                    ],
                })
            );

            expect(mockedGetBitcoinAddressHighestIndex).toHaveBeenCalledTimes(0);
            expect(mockedGetBitcoinAddresses).toHaveBeenCalledTimes(0);
            expect(mockedAddBitcoinAddresses).toHaveBeenCalledTimes(0);
            expect(mockedUpdateBitcoinAddress).toHaveBeenCalledTimes(0);
        });
    });

    describe('when pool is full and no address needs update', () => {
        it('should not perform any update/create call', async () => {
            const { result, waitFor } = renderHook(() => useBitcoinAddressPool(baseArgs));
            await result.current.fillPool();

            await waitFor(() => !result.current.isLoading);

            expect(mockedAddBitcoinAddresses).toHaveBeenCalledTimes(0);
            expect(mockedUpdateBitcoinAddress).toHaveBeenCalledTimes(0);
        });
    });

    describe('when pool is full but some addresses needs update', () => {
        beforeEach(() => {
            mockedGetBitcoinAddresses.mockResolvedValue([
                addresses[0].map((data) => ({
                    Data: {
                        ...data.Data,
                        BitcoinAddress: null,
                        BitcoinAddressIndex: null,
                        BitcoinAddressSignature: null,
                    },
                    free: noop,
                })),
            ] as unknown as WasmApiWalletBitcoinAddresses);
        });

        describe('when highest index is api one', () => {
            beforeEach(() => {
                mockedGetBitcoinAddressHighestIndex.mockResolvedValue(13);
                wasmAccount.getLastUnusedAddressIndex = vi.fn().mockReturnValue(5);
            });

            it('should update them with correct addresses, starting at correct index', async () => {
                const [primaryKey] = userKeys;
                const { result, waitFor } = renderHook(() => useBitcoinAddressPool(baseArgs));
                await result.current.fillPool();

                await waitFor(() => !result.current.isLoading);

                expect(mockedAddBitcoinAddresses).toHaveBeenCalledTimes(0);
                expect(mockedUpdateBitcoinAddress).toHaveBeenCalledTimes(3);
                expect(mockedUpdateBitcoinAddress).toHaveBeenNthCalledWith(1, '01', '001', '00001', {
                    BitcoinAddress: 'tb1qgpqu7j420k9yq2ua7q577unxd8lnw79er59tdx',
                    BitcoinAddressIndex: 14,
                    BitcoinAddressSignature: expect.any(String),
                });
                const firstCallPayload = mockedUpdateBitcoinAddress.mock.calls[0]?.[3];
                await expectSignedBy(
                    primaryKey,
                    firstCallPayload?.BitcoinAddress,
                    firstCallPayload?.BitcoinAddressSignature
                );

                expect(mockedUpdateBitcoinAddress).toHaveBeenNthCalledWith(2, '01', '001', '00002', {
                    BitcoinAddress: 'tb1ql5g2rdg93m2jja8sgx6mpktcv379daht2e7c3y',
                    BitcoinAddressIndex: 15,
                    BitcoinAddressSignature: expect.any(String),
                });
                const secondCallPayload = mockedUpdateBitcoinAddress.mock.calls[1]?.[3];
                await expectSignedBy(
                    primaryKey,
                    secondCallPayload?.BitcoinAddress,
                    secondCallPayload?.BitcoinAddressSignature
                );

                expect(mockedUpdateBitcoinAddress).toHaveBeenNthCalledWith(3, '01', '001', '00003', {
                    BitcoinAddress: 'tb1qu7kq98xnja0sv72c7w0lz0ymtnrcjjcvt8ept8',
                    BitcoinAddressIndex: 16,
                    BitcoinAddressSignature: expect.any(String),
                });
                const thirdCallPayload = mockedUpdateBitcoinAddress.mock.calls[2]?.[3];
                await expectSignedBy(
                    primaryKey,
                    thirdCallPayload?.BitcoinAddress,
                    thirdCallPayload?.BitcoinAddressSignature
                );
            });
        });

        describe('when highest index is network one', () => {
            beforeEach(() => {
                mockedGetBitcoinAddressHighestIndex.mockResolvedValue(3);
                wasmAccount.getLastUnusedAddressIndex = vi.fn().mockReturnValue(7);
            });

            it('should update them with correct addresses, starting at correct index', async () => {
                const [primaryKey] = userKeys;
                const { result, waitFor } = renderHook(() => useBitcoinAddressPool(baseArgs));
                await result.current.fillPool();

                await waitFor(() => !result.current.isLoading);

                expect(mockedAddBitcoinAddresses).toHaveBeenCalledTimes(0);
                expect(mockedUpdateBitcoinAddress).toHaveBeenCalledTimes(3);
                expect(mockedUpdateBitcoinAddress).toHaveBeenNthCalledWith(1, '01', '001', '00001', {
                    BitcoinAddress: 'tb1qfwcaxat96fqa9s5v509gx9lnltku5tnetk7f7m',
                    BitcoinAddressIndex: 8,
                    BitcoinAddressSignature: expect.any(String),
                });
                const firstCallPayload = mockedUpdateBitcoinAddress.mock.calls[0]?.[3];
                await expectSignedBy(
                    primaryKey,
                    firstCallPayload?.BitcoinAddress,
                    firstCallPayload?.BitcoinAddressSignature
                );

                expect(mockedUpdateBitcoinAddress).toHaveBeenNthCalledWith(2, '01', '001', '00002', {
                    BitcoinAddress: 'tb1q3tzkkgyvcvgjknn9fzn64e8kkm8hcx7ad0p89q',
                    BitcoinAddressIndex: 9,
                    BitcoinAddressSignature: expect.any(String),
                });
                const secondCallPayload = mockedUpdateBitcoinAddress.mock.calls[1]?.[3];
                await expectSignedBy(
                    primaryKey,
                    secondCallPayload?.BitcoinAddress,
                    secondCallPayload?.BitcoinAddressSignature
                );

                expect(mockedUpdateBitcoinAddress).toHaveBeenNthCalledWith(3, '01', '001', '00003', {
                    BitcoinAddress: 'tb1q57tgpzu6pd3djp5w7l9smcwaqu2ap7y2e9x6k8',
                    BitcoinAddressIndex: 10,
                    BitcoinAddressSignature: expect.any(String),
                });
                const thirdCallPayload = mockedUpdateBitcoinAddress.mock.calls[2]?.[3];
                await expectSignedBy(
                    primaryKey,
                    thirdCallPayload?.BitcoinAddress,
                    thirdCallPayload?.BitcoinAddressSignature
                );
            });
        });
    });

    describe('When pool is not full', () => {
        beforeEach(() => {
            mockedGetBitcoinAddresses.mockResolvedValue([[]] as unknown as WasmApiWalletBitcoinAddresses);
        });

        describe('when highest index is api one', () => {
            beforeEach(() => {
                mockedGetBitcoinAddressHighestIndex.mockResolvedValue(13);
                wasmAccount.getLastUnusedAddressIndex = vi.fn().mockReturnValue(5);
            });

            it('should update them with correct addresses, starting at correct index', async () => {
                const [primaryKey] = userKeys;
                const { result, waitFor } = renderHook(() => useBitcoinAddressPool(baseArgs));
                await result.current.fillPool();

                await waitFor(() => !result.current.isLoading);

                expect(mockedUpdateBitcoinAddress).toHaveBeenCalledTimes(0);

                expect(mockedPushBitcoinAddressesCreationPayload).toHaveBeenCalledTimes(3);
                expect(mockedPushBitcoinAddressesCreationPayload).toHaveBeenNthCalledWith(1, {
                    BitcoinAddress: 'tb1qgpqu7j420k9yq2ua7q577unxd8lnw79er59tdx',
                    BitcoinAddressIndex: 14,
                    BitcoinAddressSignature: expect.any(String),
                });
                const firstCallPayload = mockedPushBitcoinAddressesCreationPayload.mock.calls[0]?.[0];
                await expectSignedBy(
                    primaryKey,
                    firstCallPayload?.BitcoinAddress,
                    firstCallPayload?.BitcoinAddressSignature
                );

                expect(mockedPushBitcoinAddressesCreationPayload).toHaveBeenNthCalledWith(2, {
                    BitcoinAddress: 'tb1ql5g2rdg93m2jja8sgx6mpktcv379daht2e7c3y',
                    BitcoinAddressIndex: 15,
                    BitcoinAddressSignature: expect.any(String),
                });
                const secondCallPayload = mockedPushBitcoinAddressesCreationPayload.mock.calls[1]?.[0];
                await expectSignedBy(
                    primaryKey,
                    secondCallPayload?.BitcoinAddress,
                    secondCallPayload?.BitcoinAddressSignature
                );

                expect(mockedPushBitcoinAddressesCreationPayload).toHaveBeenNthCalledWith(3, {
                    BitcoinAddress: 'tb1qu7kq98xnja0sv72c7w0lz0ymtnrcjjcvt8ept8',
                    BitcoinAddressIndex: 16,
                    BitcoinAddressSignature: expect.any(String),
                });
                const thirdCallPayload = mockedPushBitcoinAddressesCreationPayload.mock.calls[2]?.[0];
                await expectSignedBy(
                    primaryKey,
                    thirdCallPayload?.BitcoinAddress,
                    thirdCallPayload?.BitcoinAddressSignature
                );

                expect(mockedAddBitcoinAddresses).toHaveBeenCalledTimes(1);
                expect(mockedAddBitcoinAddresses).toHaveBeenCalledWith(
                    '01',
                    '001',
                    expect.objectContaining({ key: 'mocked_payload' })
                );
            });
        });

        describe('when highest index is network one', () => {
            beforeEach(() => {
                mockedGetBitcoinAddressHighestIndex.mockResolvedValue(3);
                wasmAccount.getLastUnusedAddressIndex = vi.fn().mockReturnValue(7);
            });

            it('should update them with correct addresses, starting at correct index', async () => {
                const [primaryKey] = userKeys;
                const { result, waitFor } = renderHook(() => useBitcoinAddressPool(baseArgs));
                await result.current.fillPool();

                await waitFor(() => !result.current.isLoading);

                expect(mockedUpdateBitcoinAddress).toHaveBeenCalledTimes(0);

                expect(mockedPushBitcoinAddressesCreationPayload).toHaveBeenCalledTimes(3);
                expect(mockedPushBitcoinAddressesCreationPayload).toHaveBeenNthCalledWith(1, {
                    BitcoinAddress: 'tb1qfwcaxat96fqa9s5v509gx9lnltku5tnetk7f7m',
                    BitcoinAddressIndex: 8,
                    BitcoinAddressSignature: expect.any(String),
                });
                const firstCallPayload = mockedPushBitcoinAddressesCreationPayload.mock.calls[0]?.[0];
                await expectSignedBy(
                    primaryKey,
                    firstCallPayload?.BitcoinAddress,
                    firstCallPayload?.BitcoinAddressSignature
                );

                expect(mockedPushBitcoinAddressesCreationPayload).toHaveBeenNthCalledWith(2, {
                    BitcoinAddress: 'tb1q3tzkkgyvcvgjknn9fzn64e8kkm8hcx7ad0p89q',
                    BitcoinAddressIndex: 9,
                    BitcoinAddressSignature: expect.any(String),
                });
                const secondCallPayload = mockedPushBitcoinAddressesCreationPayload.mock.calls[1]?.[0];
                await expectSignedBy(
                    primaryKey,
                    secondCallPayload?.BitcoinAddress,
                    secondCallPayload?.BitcoinAddressSignature
                );

                expect(mockedPushBitcoinAddressesCreationPayload).toHaveBeenNthCalledWith(3, {
                    BitcoinAddress: 'tb1q57tgpzu6pd3djp5w7l9smcwaqu2ap7y2e9x6k8',
                    BitcoinAddressIndex: 10,
                    BitcoinAddressSignature: expect.any(String),
                });
                const thirdCallPayload = mockedPushBitcoinAddressesCreationPayload.mock.calls[2]?.[0];
                await expectSignedBy(
                    primaryKey,
                    thirdCallPayload?.BitcoinAddress,
                    thirdCallPayload?.BitcoinAddressSignature
                );

                expect(mockedAddBitcoinAddresses).toHaveBeenCalledTimes(1);
                expect(mockedAddBitcoinAddresses).toHaveBeenCalledWith(
                    '01',
                    '001',
                    expect.objectContaining({ key: 'mocked_payload' })
                );
            });
        });
    });
});
