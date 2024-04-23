import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { noop, omit } from 'lodash';
import { Mock } from 'vitest';

import {
    WasmApiWalletTransaction,
    WasmApiWalletTransactionData,
    WasmApiWalletTransactions,
    WasmTransactionDetails,
    WasmWalletClient,
} from '@proton/andromeda';
import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { mockUseNotifications } from '@proton/testing/lib/vitest';

import { useGetApiWalletTransactionData } from '../store/hooks';
import { mockUseBitcoinBlockchainContext, mockUseGetApiWalletTransactionData, mockUseWalletApi } from '../tests';
import { pgpPrvKey } from '../tests/fixtures/keys';
import { useWalletTransactions } from './useWalletTransactions';

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
    WalletAccounts: [],
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

const networkTransactions: WasmTransactionDetails[] = [
    {
        inputs: [],
        outputs: [],
        sent: 0,
        received: 77963145,
        fee: 10437,
        time: {
            confirmation_time: 1680613078,
            confirmed: true,
            last_seen: 1680613078,
        },
        txid: 'f2a58482f18a7cf245d1c588bca29ee417ee535559edd18132f15470c8377981',
        account_derivation_path: "m/84'/1'/0'",
    },
    {
        inputs: [],
        outputs: [],
        sent: 0,
        received: 836035,
        fee: 3060,
        time: {
            confirmation_time: 1712235111,
            confirmed: true,
            last_seen: 1712235111,
        },
        txid: '68fcbc9ea42f00aae70ca047dd87363f6c3b2026e4e286a16119cabd9363661b',
        account_derivation_path: "m/84'/1'/0'",
    },
    {
        inputs: [],
        outputs: [],
        sent: 0,
        received: 546,
        fee: 426,
        time: {
            confirmation_time: 1712232720,
            confirmed: true,
            last_seen: 1712232720,
        },
        txid: '5df718baf0ff146cb572d9f347881226c0d85bfc590c90c4044b847db85a20db',
        account_derivation_path: "m/84'/1'/0'",
    },
];

const apiTransactions: WasmApiWalletTransaction[] = [
    {
        WalletID: '01',
        WalletAccountID: '001',
        ID: '0001',
        TransactionID:
            'wcBMA5fAXxAlQaycAQf8CjDV7gy1vQcYgCJD32/GitZOh11BnMB/7VBtKzQ+kbxUoQeeJ4iuyAMRAIIkbZRVwW0ax97X3yVpP9ACxopkd2gEWi1jNI2Xdcp1+mJuqsQIPdFCkgEKYe1zJca7g04SnW+CWrTcz2GHwZm7aAaBfuq5bU+dop+rXfvqsSSVqjQAtP5UVGnptXqoBa+wfFjJah2dsqEhiu+Ia5hjm4kT6WapxbvHqT8LulrzcrEjlRBhyjSfVDRL0FsFatiBR2K/qWJSw5Rz3C30DvtH1GNY7Qw5JrPzdABMS5XR+84gWWOhwSCWouZGyefnluh/PmI2AdcuL4zuDtAAXCtDC0XQk9LA9gG3zj5zJu8oSVRFLCGPzI3U0nt2g5xr6jQXS4Y9qt3O6Laqzm8XdA+42ncTNdogMwT78hoxQI4zRBPRfE/NZtNWgwZlulzYxK3vOnUR6/z33JCW5BUQvZRhcqSJePjMv/CDU3nSnqoD0bmTVsJdzgMmUW5ox+8LmpGV/IXCji/eqD2jIyjX8VeKAznlN1AX+6Pb6SrW0hmH1pmV6FUGG/JjLJp7/FDyGfjLWa+e2TilcHp1iHUw8KTw2Oo/0tACkTN0m+wOjHaDPS++ILiMJxmDMrCbvPWATPClvLcHbNoB9NV9MacwnAaIOdIA7wqnXy/fwUMmQpMLylrEfvG/B98Fbr93OxB0b3WxaAoHBbN0N7w7fi1jQPCZ+hIJDwqWgPhKmipECLXTMDQm0djRxaB/TFvdtaLjKyiUej34CfJ5mXEhvbEEP0wv7T4ZLyy/PxV4pJr6qsfqGbuJFIbl9xMVca9pL47Vzf3fvBzgSETnOzW27D7oYzJYYrdbHAlZ7Z2/z2Tr4ABk32aYLa2FtEQE9t2hwZeo8FLEUOx22RKW0fzZErUtmrdfSzfSOBPiOsn9bGGWUw==',
        TransactionTime: '',
        HashedTransactionID: 'UI9Ip7pEeHkdWPWZI+Pd8cYaaJmnumuDGUzdX+OZ6l0=',
        Label: '',
        ExchangeRate: null,
    },
    {
        WalletID: '01',
        WalletAccountID: '001',
        ID: '0002',
        TransactionID:
            'wcBMA5fAXxAlQaycAQf/WeKeGEht1b+3y9PN4HgJiGoQZ69ijGfRBsAqXoLz5i0WMHKOdNUClOcMpw8OdEy14ImUoxUCX0CFBxFM81qfGK5UOeVx+wsQjfuHarvw9Me9RdhD5KffonCO5W1qf4os+jCF02oRHVA8RdgP/+ZQGKK7zcUN9+QHenvYJEf7+bWb9t6opofD6Iqk0cYN8tWZ4E943LBPHdlyicRoPUZ6PSAueAlAKy3Gw9Xqk6gtgIA05uEboznERXzYDAXcwTCR7NNOJAjgAOv1xfB9Yq8wcLHowADDn6sTldA05uXgniTSSmwgEQArIMdyxVafukP8ByhKprp/8nOup9ychTBCkNLA9gHyP9zOyjFM2OjnOqS8scFIYwjbnQR96IGPuzfS10hbXp+zWTTq2N36eJosUILufiJcOEJNq6CjVBL8RxkzLlKReNzCHFg3+jX5fN1qsSwdcyn/F7XcVeMT1PrQcSA6gjUgb8CV2/M9vjNt4wD8vbqQzRMVoH1PDC3VdROvel7RaKb2XgNN1kzSUC8IzAp3YLj+r+QSvQZDtDq3oRxqnl+qy/mVhYs7PplOhNsI5lHSslGijQo5QRPUnmqlKMiuXvrNpZho5aE3mAJ2pCzM7n9Ts524xbp701hBxIgP766vf83Hek6AszEkfPZL7+VXrg1QvUqgVkooW/kNCgFrC9s0YDPF4d0994ZbwkDEUclqwOF3KkfFHjTbgT46T7iIgkHGopUiRLkCgcdNfVyLKtKCdkLxT1IoTJSKIXn02kEnIbJ1EU8MCHAmhuY0oCIdfHXJBveN8tTY1PESKYetuZqXMngr5sX810Shl2n+sQ6sho7BUiufcQduy/jd/2w/Gey61k+enYYC8X0xVRMrcah9rmWGZVtsiLZCUsZFn8uDCf1YkH/u14fHFH5Fa5P2bFQbldbt/w==',
        TransactionTime: '',
        HashedTransactionID: 'zaJHG6kJW4d47QqMPr4pE9ysbl8EwIpzSOxByubrQrc=',
        Label: '',
        ExchangeRate: null,
    },
    {
        WalletID: '01',
        WalletAccountID: '001',
        ID: '0003',
        TransactionID:
            'wcBMA5fAXxAlQaycAQf/WDCE22ixH5MUns6TEbyix00LVMDI7WlU8u7BaiZTzyqoABoHIkYPlBrnkfdvgYKRZoMXXmKIH4MmfyDtgo9Ykj3ogX47aySZAuapqqcePW/SawkG5mvgjL5FiJWqUc0+CMBMB9t7NRlNB37C5+oEdw2Vx71J+E25G5ktEUJXAozjqkDVjeD5P/B108DjFmnVVzILpu+lPSdz2KMjXJ0uOQRpaDRA1+c+Tv/ZyrR4IdET7N5cqpCy+lVAWxW16aiXDjz+ktVgqn6zYeeKoLkcq+c2qf8+KujhNj4M2euRDHfouOmMlssH0T0dqOpLeZJTx47DjGIuLugitjYJNcNjU9LA9gGxL7xO/7tAP/pNl8/JXxd3r/K7o5cYVflPdGwN1gkXlWBwaDgP3xczzfcBizcBvSlzp+p3S5zN07Ug1ZBaFhmWu4xzPtN8fIBNv5o9gK0WCPj2OXzoDbSrho2+3Jf9+bGWKl6e8M4q+EH2WaU+Lyyh7pDQiwuQx82i7xFEdAOuxjY4UazSP/g9abVcsSgES3mawrT8QsetTNKtANO8p87459oLr/Sq3hhjUbGExhGIUdwDfp/Oy951vLXVgHxQ6slkorIOrT0kmGVsRvV++dUpB3nsa7m7ydYVAhULFO/CfmfKseh3fxKIrvAx02itjjVnzQN0fs1gqeSlx15rmgbzxf9d9c4dLnZz0xmTagy8kz7OKhy4sUDdhdyNFmLOhDTCnWM0K6+hWkaOF0XD3GQoAEgHZaxWDS6WxaCz4EE+HkZOTzvXR+4fH5QiR4ebXbKmz6untiOoAfS4/l/K0BOYMfddCIEBHfwGq6b/IaNIIPNVR5rGlx7odFT4s620bsiTqSo9twrmoiu9Fo277cQbomkVfrBOs+Asc4eWoc6WPxcsTE17m743cj8/beBHGh+ILGxZHw==',
        TransactionTime: '',
        HashedTransactionID: 'U6oey3/f1qlaZOpQJcQp7Jt7UhEbK+0Uk38XCJYevkc=',
        Label: '',
        ExchangeRate: null,
    },
];

const otherTx: WasmApiWalletTransaction = {
    WalletID: '01',
    WalletAccountID: '001',
    ID: '004',
    TransactionID:
        'wcBMA5fAXxAlQaycAQf+Os24E1z8uPmuiPDNdV3OFvS0/oydoVrCxT6TP/Mxs8/zyHFmXAUcm8uz/owGU/2CZHgUr7CbaMtKmv2YaQseOxs26yx/8becmkEX1QeSap8jDkahzpIUaY8z+1ufhK3Add4X3o4cjIXvrWpKUmYY4O5htYPlNvbBGrm6BHdUUMeVUih+O4KK8m1fLgdW/fVL0An+PyQRGViuC9eUUPJAEK0YrD8Yh6xsr3FYbx8KLIwtGmzTmIOfjiMWy6rVf3GY2ro/tCzv6ja7+Fq8nAvwPIdeNY4/jc2tKYSKpwSgTVXOV4PMpJI1RS98wsxFnCYX71hFWGFps4+1QVL+jMQQntLA9gG93+kGsGuEsvu/RnMmkGOPV4W0Eg0HfzVjXJNAoKQljq4TtgNm2ntEybcRMZED+sIk5NNvsvX1Y+/f+AkDQyxJ7kjmbwF8C5lKLgToGAbBtVey/ufEX5BvoavHsHtMqASsrDnVRf2r3F7d0N+d4hAcyYRLirY1gBMu40Kb4Dz3I86t+dIr3HwwPdvZwfzScdAPJFpzOHw/FahN7aN2I4SL9vey+NRSQorEQY7FmzMtVfvRt9F11oKQpYrGDAqpPi71c6yHYelcoX52ZM1k4YYHfVsycs09hRY1LD8YdbCiQODV6axkyrpmUKU6GUezHXaBC8lnJu4r8KrEj2nKABfMG8dFyi8kVdlAb7Srj4Gdo6FJtFC79X8g+P6OzXlfAv8gF7tNwEdFZ2HSJa3OvldtuPF0py4Yqm8uF5I/3nJN3UdE90Rd5+CJlkZk4sbZLpZtAGbvkuGedmoFzHpNNTYQJjXKifY3gCqwOCnUSki+93Pheq188G72BxpTjrUkgNaksCTtyJgV/k3EOyj+188jVnM9mPNI9CnS4AsSpDr3LW6EsD4nv/u4eCx7sBWnLXXQvpBZ2A==',
    TransactionTime: '',
    HashedTransactionID: 'V8w6hfsV+gp/LT3LtFzmJD4mlWjAAfa0Iuco0XtzS2s=',
    Label: '',
    ExchangeRate: null,
};

// TODO: move this to proper file
type MockedFunction<F extends (...args: any) => any> = Mock<Parameters<F>, ReturnType<F>>;

describe('useWalletTransactions', () => {
    let userKeys: DecryptedKey[] = [];

    const mockedGetApiWalletTransactionData: MockedFunction<ReturnType<typeof useGetApiWalletTransactionData>> =
        vi.fn();
    const mockedGetWalletTransactionsToHash: MockedFunction<WasmWalletClient['getWalletTransactionsToHash']> = vi.fn();
    const mockedCreateWalletTransaction: MockedFunction<WasmWalletClient['createWalletTransaction']> = vi.fn();
    const mockedUpdateWalletTransactionHashedTxId: MockedFunction<
        WasmWalletClient['updateWalletTransactionHashedTxId']
    > = vi.fn();

    beforeAll(async () => {
        await CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());

        userKeys = await getUserKeys();
    });

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    beforeEach(() => {
        mockUseNotifications();
        mockUseBitcoinBlockchainContext({
            accountIDByDerivationPathByWalletID: { [wallet.Wallet.ID]: { ["m/84'/1'/0'"]: '001' } },
        });

        mockedGetApiWalletTransactionData.mockResolvedValue(apiTransactions.map((t) => ({ Data: t, free: noop })));
        mockUseGetApiWalletTransactionData(mockedGetApiWalletTransactionData);

        mockedGetWalletTransactionsToHash.mockReset();
        mockedCreateWalletTransaction.mockImplementation(async (walletId, walletAccountId, payload) => ({
            Data: {
                ID: '',
                WalletID: walletId,
                WalletAccountID: walletAccountId,
                TransactionID: payload.txid,
                TransactionTime: payload.transaction_time as string,
                HashedTransactionID: payload.hashed_txid,
                Label: payload.label,
                ExchangeRate: null,
            },
            free: noop,
        }));

        mockedUpdateWalletTransactionHashedTxId.mockReset();

        mockUseWalletApi({
            wallet: {
                getWalletTransactionsToHash: mockedGetWalletTransactionsToHash,
                createWalletTransaction: mockedCreateWalletTransaction,
                updateWalletTransactionHashedTxId: mockedUpdateWalletTransactionHashedTxId,
            },
        });
    });

    describe('when transactions is empty', () => {
        it('should not fail', async () => {
            const transactions: WasmTransactionDetails[] = [];
            const { result } = renderHook(() => useWalletTransactions({ transactions, wallet, keys: userKeys }));

            expect(result.current.transactionDetails).toHaveLength(0);
        });
    });

    describe('when transaction is not empty', () => {
        describe('when all tx are found', () => {
            beforeEach(() => {
                mockedGetApiWalletTransactionData.mockResolvedValue(
                    apiTransactions.map((t) => ({ Data: t, free: noop }))
                );
            });

            it('should reconciliate network data with db data', async () => {
                const { result } = renderHook(() =>
                    useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                );

                await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                expect(result.current.transactionDetails).toStrictEqual([
                    {
                        networkData: networkTransactions[0],
                        apiData: apiTransactions[0],
                    },
                    {
                        networkData: networkTransactions[1],
                        apiData: apiTransactions[1],
                    },
                    {
                        networkData: networkTransactions[2],
                        apiData: apiTransactions[2],
                    },
                ]);

                expect(mockedGetApiWalletTransactionData).toHaveBeenCalledTimes(1);
                expect(mockedGetApiWalletTransactionData).toHaveBeenCalledWith(wallet.Wallet.ID, undefined, [
                    // 1rst network tx's hashedTxId
                    'UI9Ip7pEeHkdWPWZI+Pd8cYaaJmnumuDGUzdX+OZ6l0=',
                    // 2nd network tx's hashedTxId
                    'zaJHG6kJW4d47QqMPr4pE9ysbl8EwIpzSOxByubrQrc=',
                    // 3rd network tx's hashedTxId
                    'U6oey3/f1qlaZOpQJcQp7Jt7UhEbK+0Uk38XCJYevkc=',
                ]);
            });

            it('should not make any other call than get-transactions', async () => {
                const { result } = renderHook(() =>
                    useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                );

                await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                expect(mockedGetWalletTransactionsToHash).toHaveBeenCalledTimes(0);
                expect(mockedCreateWalletTransaction).toHaveBeenCalledTimes(0);
                expect(mockedUpdateWalletTransactionHashedTxId).toHaveBeenCalledTimes(0);
            });
        });

        describe('when some tx are not found', () => {
            beforeEach(() => {
                mockedGetApiWalletTransactionData.mockResolvedValue([{ Data: apiTransactions[0], free: noop }]);
            });

            describe('when some txs are created but not hashed', () => {
                beforeEach(() => {
                    mockedGetWalletTransactionsToHash.mockResolvedValue([
                        [
                            { Data: omit(apiTransactions[1], 'HashedTransactionID') },
                            { Data: omit(apiTransactions[2], 'HashedTransactionID') },
                        ],
                    ] as unknown as WasmApiWalletTransactions);

                    mockedUpdateWalletTransactionHashedTxId.mockResolvedValueOnce({
                        Transaction: apiTransactions[1],
                    } as unknown as WasmApiWalletTransactionData);

                    mockedUpdateWalletTransactionHashedTxId.mockResolvedValueOnce({
                        Transaction: apiTransactions[2],
                    } as unknown as WasmApiWalletTransactionData);
                });

                it('should fetch tx with missing hash and update them', async () => {
                    const { result } = renderHook(() =>
                        useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                    );

                    await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                    expect(mockedGetWalletTransactionsToHash).toHaveBeenCalledTimes(1);
                    expect(mockedGetWalletTransactionsToHash).toHaveBeenCalledWith(wallet.Wallet.ID);

                    expect(mockedUpdateWalletTransactionHashedTxId).toHaveBeenCalledTimes(2);
                    expect(mockedUpdateWalletTransactionHashedTxId).toHaveBeenNthCalledWith(
                        1,
                        //  wallet id
                        '01',
                        //  wallet account id
                        '001',
                        //  wallet transaction id
                        '0002',
                        'zaJHG6kJW4d47QqMPr4pE9ysbl8EwIpzSOxByubrQrc='
                    );
                    expect(mockedUpdateWalletTransactionHashedTxId).toHaveBeenNthCalledWith(
                        2,
                        //  wallet id
                        '01',
                        //  wallet account id
                        '001',
                        //  wallet transaction id
                        '0003',
                        'U6oey3/f1qlaZOpQJcQp7Jt7UhEbK+0Uk38XCJYevkc='
                    );
                });

                it('should set updated transactions in map', async () => {
                    const { result } = renderHook(() =>
                        useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                    );

                    await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                    expect(result.current.transactionDetails).toStrictEqual([
                        {
                            networkData: networkTransactions[0],
                            apiData: apiTransactions[0],
                        },
                        {
                            networkData: networkTransactions[1],
                            apiData: apiTransactions[1],
                        },
                        {
                            networkData: networkTransactions[2],
                            apiData: apiTransactions[2],
                        },
                    ]);
                });

                describe('when tx hash update call fails', () => {
                    beforeEach(() => {
                        mockedUpdateWalletTransactionHashedTxId.mockReset();
                        mockedUpdateWalletTransactionHashedTxId.mockRejectedValue(new Error('err'));
                    });

                    it('should still set updated transactions in map', async () => {
                        const { result } = renderHook(() =>
                            useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                        );

                        await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                        expect(result.current.transactionDetails).toStrictEqual([
                            {
                                networkData: networkTransactions[0],
                                apiData: apiTransactions[0],
                            },
                            {
                                networkData: networkTransactions[1],
                                apiData: apiTransactions[1],
                            },
                            {
                                networkData: networkTransactions[2],
                                apiData: apiTransactions[2],
                            },
                        ]);
                    });
                });
            });

            describe('when tx are not created at all', () => {
                beforeEach(() => {
                    mockedGetWalletTransactionsToHash.mockResolvedValue([[]] as unknown as WasmApiWalletTransactions);

                    mockedCreateWalletTransaction.mockResolvedValueOnce({
                        Data: apiTransactions[1],
                    } as unknown as WasmApiWalletTransactionData);

                    mockedCreateWalletTransaction.mockResolvedValueOnce({
                        Data: apiTransactions[2],
                    } as unknown as WasmApiWalletTransactionData);
                });

                it('should fetch tx with missing hash and update them', async () => {
                    const { result } = renderHook(() =>
                        useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                    );

                    await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                    expect(mockedCreateWalletTransaction).toHaveBeenCalledTimes(2);
                    expect(mockedCreateWalletTransaction).toHaveBeenNthCalledWith(
                        1,
                        //  wallet id
                        '01',
                        //  wallet account id
                        '001',
                        {
                            exchange_rate_id: null,
                            hashed_txid: 'zaJHG6kJW4d47QqMPr4pE9ysbl8EwIpzSOxByubrQrc=',
                            label: null,
                            transaction_time: '1712235111',
                            // TODO: check PGP message validity
                            txid: expect.any(String),
                        }
                    );
                    expect(mockedCreateWalletTransaction).toHaveBeenNthCalledWith(
                        2,
                        //  wallet id
                        '01',
                        //  wallet account id
                        '001',
                        {
                            exchange_rate_id: null,
                            hashed_txid: 'U6oey3/f1qlaZOpQJcQp7Jt7UhEbK+0Uk38XCJYevkc=',
                            label: null,
                            transaction_time: '1712232720',
                            // TODO: check PGP message validity
                            txid: expect.any(String),
                        }
                    );
                });

                it('should set updated transactions in map', async () => {
                    const { result } = renderHook(() =>
                        useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                    );

                    await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                    expect(result.current.transactionDetails).toStrictEqual([
                        {
                            networkData: networkTransactions[0],
                            apiData: apiTransactions[0],
                        },
                        {
                            networkData: networkTransactions[1],
                            apiData: apiTransactions[1],
                        },
                        {
                            networkData: networkTransactions[2],
                            apiData: apiTransactions[2],
                        },
                    ]);
                });

                describe('when tx creation call fails', () => {
                    beforeEach(() => {
                        mockedCreateWalletTransaction.mockReset();
                        mockedCreateWalletTransaction.mockRejectedValue(new Error('err'));
                    });

                    it('should not set the transaction in map', async () => {
                        const { result } = renderHook(() =>
                            useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                        );

                        await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                        expect(result.current.transactionDetails).toStrictEqual([
                            {
                                networkData: networkTransactions[0],
                                apiData: apiTransactions[0],
                            },
                            {
                                networkData: networkTransactions[1],
                                apiData: null,
                            },
                            {
                                networkData: networkTransactions[2],
                                apiData: null,
                            },
                        ]);
                    });
                });
            });
        });

        describe('when some unhashed tx are found, not related with current map', () => {
            beforeEach(() => {
                mockedGetApiWalletTransactionData.mockResolvedValue([]);

                mockedGetWalletTransactionsToHash.mockResolvedValue([
                    [{ Data: omit(otherTx, 'HashedTransactionID') }],
                ] as unknown as WasmApiWalletTransactions);

                mockedUpdateWalletTransactionHashedTxId.mockResolvedValueOnce({
                    Data: otherTx,
                } as unknown as WasmApiWalletTransactionData);
            });

            it('should fetch tx with missing hash and update them', async () => {
                const { result } = renderHook(() =>
                    useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                );

                await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                expect(mockedGetWalletTransactionsToHash).toHaveBeenCalledTimes(1);
                expect(mockedGetWalletTransactionsToHash).toHaveBeenCalledWith(wallet.Wallet.ID);

                expect(mockedUpdateWalletTransactionHashedTxId).toHaveBeenCalledTimes(1);
                expect(mockedUpdateWalletTransactionHashedTxId).toHaveBeenNthCalledWith(
                    1,
                    //  wallet id
                    '01',
                    //  wallet account id
                    '001',
                    // wallet transaction id
                    '004',
                    'V8w6hfsV+gp/LT3LtFzmJD4mlWjAAfa0Iuco0XtzS2s='
                );
            });

            it('should not add transaction to the map', async () => {
                const { result } = renderHook(() =>
                    useWalletTransactions({ transactions: networkTransactions, wallet, keys: userKeys })
                );

                // map init
                await waitFor(() => expect(result.current.loadingRecordInit).toBeFalsy());
                expect(result.current.transactionDetails.length).toStrictEqual(3);

                // map completion
                await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                // after updating the other tx
                expect(mockedUpdateWalletTransactionHashedTxId).toHaveBeenCalledTimes(1);
                // other tx is not added to map
                expect(result.current.transactionDetails.length).toStrictEqual(3);
            });
        });
    });
});
