import { renderHook } from '@testing-library/react-hooks';
import { noop } from 'lodash';
import { MockedFunction } from 'vitest';

import {
    WasmAccount,
    WasmApiWalletBitcoinAddresses,
    WasmBitcoinAddressClient,
    WasmDerivationPath,
    WasmFiatCurrencySymbol,
    WasmNetwork,
    WasmScriptType,
    WasmWallet,
} from '@proton/andromeda';
import { CryptoProxy } from '@proton/crypto/lib';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';
import { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { mockUseGetAddressKeys, mockUseNotifications } from '@proton/testing/lib/vitest';
import { expectSignedBy, getAddressKey, getMockedApi, mockUseWalletApiClients } from '@proton/wallet/tests';

import { useBitcoinAddressPool } from '.';
import { useGetBitcoinAddressHighestIndex } from '../../store/hooks/useBitcoinAddressHighestIndex';
import { mockUseGetBitcoinAddressHighestIndex } from '../../tests/mocks/useBitcoinAddressHighestIndex';

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
            DerivationPath: "84'/1'/0'",
            Addresses: [{ ID: '0000001', Email: 'pro@proton.black' }],
            FiatCurrency: 'USD' as WasmFiatCurrencySymbol,
        },
    ],
    WalletKey: {
        WalletID: '01',
        UserKeyID: '',
        // encrypted with key in tests/fixtures/keys.ts
        // 195, 144, 231, 166, 130, 1, 110, 215, 117, 236, 57, 29, 47, 122, 226, 13, 195, 81, 179, 248, 126, 86, 0, 117, 231, 51, 20, 99, 99, 102, 146, 36
        WalletKey: `-----BEGIN PGP MESSAGE-----

wcBMA5fAXxAlQaycAQf+KlcXmGcpx6svCsc3Dm3pIg7y3XQjOrstbWROLfAJ
ouuVU+BazOaBwxM6IGC8onqCemEGmtR/v6FXvtEp99fhDlCetUDYakQ1iicH
tQbOTC5H0XofqxF0citKInGzN3Z0ZJ68PTVy/bPyeRxfxzJJ79FmWXk5kqQL
0AS7SuqVNWddqwxAZjf7VOS1vL3CYCLtuWrcwDyd481MQUiJZ7uMaimmdaj5
94qHDYbAtdMEefzW7NuRzSphxLDstjWUtDjbnz1RoANwoYtfIliAaecAZAnj
0yrtFo1WbPjnND5oZrYTnIwQhI9v29heygewT0z/JjcgOYSK37OGyoe4IYpK
NtLA9AFr28nDqtKV5g/Z9tGpbi3PWbLRD7Cv8tPS3bCpcHrEq1Tm1/svemi4
YbBJvfrzmQGaoU8LAwGf3JFHmHRmQ0BHZln7LdC7BXzu/2yTqpmGWQAn7VFl
HHhREjDr+lmz3ejHAynjYmsfny1NSiVBCDaa5pHvsh2REikE2Q3ldVg6f5WE
7WuJN5o5TFhwzXgiYVqLdHYY0ALaxdC7Rq8aSMzz+TtAWLKXmDwTYQcqVAaU
+AqOB0FXdjkxeywxgsWQFPOHR1gAfd0YxdrBPzee2uRt/2SHvZTdz2WkePeT
chvnqhTO42EBj0l3FADUKpI3p5b2n27/S6E+jmrPeg3e88YstuPyURmzG2i8
x4/2csUAQfjj4cmwtjtaMLinQyA2sxj8N3uoA2oQcZXbMIcuXKqsgdnvzLtg
RE2dhKU7vkcNcDieNo87CBuh7VhHHEnaPfL/pLqhFrk0yoMXSQh4eOiI2Fzc
8EM9RfweY58Iq3StkFgaLnZhR8t2Nl9JdnAXKOpwKRs07E3TK0k7Ufdrzooq
+dh7QkWaXkaMMxs3AiS6RyEjiJyp6hL+G8E9BKyhlCnvyDk=
=Rh/8
-----END PGP MESSAGE-----`,
        WalletKeySignature: `-----BEGIN PGP SIGNATURE-----

wsCYBAABCgBMBYJmUS+LCZCXwF8QJUGsnCSUgAAAAAARAApjb250ZXh0QHBy
b3Rvbi5jaHdhbGxldC5rZXkWIQQ3HbUNIAEr3zCRK0GXwF8QJUGsnAAAw8YH
/A6uRgXpQJnKwrXZHBvvelwlBXyrD+gsm9fcTZaPXXDeuO59dZDK4n0k7Ywg
aOxhVGOnSA0R/LYhi23z/oYQcdpotVuqaR6rSympPgYSZ369fMnPbKDcN68o
pLR/Rc+bVDHGQlKAunZlpoDiP4WTCtcoSVgRq0Vgu2kpRnw7x5ZuSxSdQHnH
D7YwvjrKg0m4ukwZWqa5fjQXENEcKyZ7hbAfU54dCVyAlyTRqocRu16goFdH
toZrtZQxKoIThEMXbeiwqB+2m3YIKcR4zPkuh5G7INzvWUBG7MSbVB4RcKL1
zUszcwqfo8xsUcVcV2oHinjJ6rndMIQkP8hsnkk2FaY=
=/XrJ
-----END PGP SIGNATURE-----`,
    },
    WalletSettings: {
        WalletID: '01',
        HideAccounts: 0,
        InvoiceDefaultDescription: null,
        InvoiceExpirationTime: 0,
        MaxChannelOpeningFee: 0,
        ShowWalletRecovery: false,
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
                BitcoinAddress: 'tb1qa5fgf5ved0q2565jm9d30h2m0c43de8a62jky6',
                BitcoinAddressSignature: `-----BEGIN PGP SIGNATURE-----

wsCkBAEBCgBYBYJmUS+dCZCXwF8QJUGsnDCUgAAAAAARABZjb250ZXh0QHBy
b3Rvbi5jaHdhbGxldC5iaXRjb2luLWFkZHJlc3MWIQQ3HbUNIAEr3zCRK0GX
wF8QJUGsnAAABRYH+gO2IGw2j4+4I7kZGrFahGifrmFbSbKV1cKxz5tx9wtZ
lznobfmNLPu7RAZp+5Eeln5PjvCqo9yzfqUb+dUcdeWidZSNB09l1O+oWUy1
8AW+bDpYr+IIQYUZOCJi5pfrOQDOsNCmS2wgblcbV5C2+cagohnEu3eOGyrY
E43goTqssZy0rC9nPBV1vKkvJEHoGn3fLp2Jjhan4k79KuSHpAeYwagifM2/
eK2p7qfpnO9qYi+ksMVZCVk1jIIfvlbxtleGs+7+awEY2rNJv+oFrCz2dReV
ymT4bxnpnAhjBdQ1PmNtGJ2aMT1g50n9gViY38LcbB2xUTU9XN4kBEqH/aY=
=11Il
-----END PGP SIGNATURE-----`,
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
                BitcoinAddress: 'tb1qexdkj2l0fe9nanuah8xt9cz32el8y0evx9xshm',
                BitcoinAddressSignature: `-----BEGIN PGP SIGNATURE-----

wsCkBAEBCgBYBYJmUS+2CZCXwF8QJUGsnDCUgAAAAAARABZjb250ZXh0QHBy
b3Rvbi5jaHdhbGxldC5iaXRjb2luLWFkZHJlc3MWIQQ3HbUNIAEr3zCRK0GX
wF8QJUGsnAAApVEIAJDUxMg9JmkrlA2sNfAA5gENBf+CUg0ntwIdXlAF4hUu
9uCaNz4r2KC/0/XFxkzFxZYtEO5LnO3cdqjYxYjlnMnwrx3mC/3zBYSB9QII
5qNAxjfiioSWJCEIfpjNT5ZW6AWf5njtCjMp4SP6ra6iL/ZtwyBRLSuMVVz4
6mzo2x6EPKgdtBvikYq8PBEKHmYNTBl5WHqbiAF1UvecWSpgSaD8YHjJmbs8
3lPv+cGl/S23mQhjONJ3qtEZ6AgToGQpGgRhHUp91/3C1d/6sIL/18uF9nZu
HfXvVImkg5yT7o9MOwFAqcLjED0sSrcLdbc6nOizTl3TWuoJLpRkRlauYjc=
=Xt1Z
-----END PGP SIGNATURE-----`,
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
                BitcoinAddress: 'tb1qsk32zvua335u0xmycf44pz774y3tuu54rt0tp2',
                BitcoinAddressSignature: `-----BEGIN PGP SIGNATURE-----

wsCkBAEBCgBYBYJmUS/LCZCXwF8QJUGsnDCUgAAAAAARABZjb250ZXh0QHBy
b3Rvbi5jaHdhbGxldC5iaXRjb2luLWFkZHJlc3MWIQQ3HbUNIAEr3zCRK0GX
wF8QJUGsnAAAjU8H/RgwjfBKVZvFMoDIhgeOPjTpMbJyHEci2U3XY00sX/Oj
p1rDmc6COV5jqQ40mx4HVrbHMBzu+RcD1FEGQPPk2LPSpO3AGrkO0hFXR1Zm
NqA3t+oNGvOGgmvZuAlCrRExBtHhBceRGvzUEv6X5C5NTkravulbX8/NBPjX
R5KKtBbEq0u15YymagKO/pAzdiaC/xjUJWHB4UkhcFtAhVVZVq8kuxdtM601
6s34t3aHpKR9rD/rfZw54X1EB/0qx5PT+7wjG11TThawoTvGKTRbZdf9h0CR
4KbcIjgJ6A/JUJZXZ2WEwlfqP6zEqc8PqXJHEdL5MQ+O6sJ/oZ0U2fWCLG8=
=Y6Pd
-----END PGP SIGNATURE-----`,
                BitcoinAddressIndex: 2,
            },
            free: noop,
        },
    ],
] as unknown as WasmApiWalletBitcoinAddresses;

let baseArgs: Parameters<typeof useBitcoinAddressPool>[0];

describe('useBitcoinAddressPool', () => {
    let addressKey: { address: Address; keys: DecryptedAddressKey[] };

    const mockedGetBitcoinAddressHighestIndex: MockedFunction<ReturnType<typeof useGetBitcoinAddressHighestIndex>> =
        vi.fn();
    const mockedGetBitcoinAddresses: MockedFunction<WasmBitcoinAddressClient['getBitcoinAddresses']> = vi.fn();
    const mockedAddBitcoinAddresses: MockedFunction<WasmBitcoinAddressClient['addBitcoinAddress']> = vi.fn();
    const mockedUpdateBitcoinAddress: MockedFunction<WasmBitcoinAddressClient['updateBitcoinAddress']> = vi.fn();

    let wasmAccount: WasmAccount;

    beforeAll(async () => {
        await CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());

        addressKey = await getAddressKey();
        mockUseGetAddressKeys(vi.fn(async () => addressKey.keys));
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
            WasmDerivationPath.fromString("84'/1'/0'")
        );

        baseArgs = {
            decryptedApiWalletsData: [wallet],
            walletsChainData: {
                '01': {
                    wallet: wasmWallet,
                    accounts: {
                        '001': {
                            account: wasmAccount,
                            derivationPath: "84'/1'/0'",
                            scriptType: 2,
                        },
                    },
                },
            },
        };

        mockUseWalletApiClients(
            getMockedApi({
                bitcoin_address: {
                    getBitcoinAddresses: mockedGetBitcoinAddresses,
                    addBitcoinAddress: mockedAddBitcoinAddresses,
                    updateBitcoinAddress: mockedUpdateBitcoinAddress,
                },
            })
        );

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
        await result.current.fillBitcoinAddressPools();

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
            await result.current.fillBitcoinAddressPools();

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
                const [primaryKey] = addressKey.keys;
                const { result, waitFor } = renderHook(() => useBitcoinAddressPool(baseArgs));
                await result.current.fillBitcoinAddressPools();

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
                const [primaryKey] = addressKey.keys;
                const { result, waitFor } = renderHook(() => useBitcoinAddressPool(baseArgs));
                await result.current.fillBitcoinAddressPools();

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
                const [primaryKey] = addressKey.keys;
                const { result, waitFor } = renderHook(() => useBitcoinAddressPool(baseArgs));
                await result.current.fillBitcoinAddressPools();

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
                const [primaryKey] = addressKey.keys;
                const { result, waitFor } = renderHook(() => useBitcoinAddressPool(baseArgs));
                await result.current.fillBitcoinAddressPools();

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
