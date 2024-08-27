import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { noop, omit } from 'lodash';
import type { Mock } from 'vitest';

import type {
    WasmApiWalletTransaction,
    WasmApiWalletTransactionData,
    WasmApiWalletTransactions,
    WasmTransactionDetails,
    WasmWalletClient,
} from '@proton/andromeda';
import { WasmScriptType } from '@proton/andromeda';
import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';
import type { Address, DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces';
import { mockUseAddressKeys, mockUseNotifications } from '@proton/testing/lib/vitest';
import type { IWasmApiWalletData } from '@proton/wallet';
import { getSymmetricKey } from '@proton/wallet';
import { getAddressKey, getMockedApi, getUserKeys, mockUseWalletApiClients } from '@proton/wallet/tests';
import { buildMapFromWallets } from '@proton/wallet/utils/wallet';

import type { useGetApiWalletTransactionData } from '../store/hooks';
import { mockUseBitcoinBlockchainContext, mockUseGetApiWalletTransactionData } from '../tests/';
import { useWalletTransactions } from './useWalletTransactions';

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
        account_derivation_path: "84'/1'/0'",
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
        account_derivation_path: "84'/1'/0'",
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
        account_derivation_path: "84'/1'/0'",
    },
];

const apiTransactions: WasmApiWalletTransaction[] = [
    {
        WalletID: '01',
        WalletAccountID: '001',
        ID: '0001',
        TransactionID: `-----BEGIN PGP MESSAGE-----

wcBMA5fAXxAlQaycAQf+LO834Vz+OEP8G8i0C95YmPXS+QhUxwQQtolDpRhc
od20HaHkUM7DMifBncmAG0wV2kqpRLPN6RHE2VmQPfIaXA7f+BcOtvdMxMFD
eP4ozgqebBkXVYPurxlSnlCbmVq38TpAnZfK/tdapFM4A2OHc8opKjO0HCFC
dY2yj4HziGfLAJWYw2Nppwj8gTV+zbz6Hh7aV97zMmlY7G8QeC2IOpIx5Eja
YiWDeqa2EUq3IppByB7sJniL9+L3GVlSGi92WvcE5Dj09ZirnPeyjCwUrJJ9
Erncj7+xOux5dC6DAXos0dRUyrH3zHsMQR4jrsUEz7AV4wbTj5NL36CRMLQR
GdLA9gF+JC4YjwNAA7852tnpY/G45NCbTWxHUtBKMsP6x3MorTl4h8YVo0Qc
5PPvlXXHGRJNRIrLtQz4qydzRFYsd1wIiGqXHnqh43tv35odv84wHCGTIlO7
34GDQm9rmDGw+y7sw7csUp4dCVlMbyWHTSeDVWbdnExCT91RPqU7a/Tc2Pi2
QALY/sJB+x5tFAWFDbC0wMsiu1PH5O47FQmkXHL+L9TOd+tPuHK9vdK8jmEn
j4ge+z2sdy7ZiSJ591bI/FkSeaJLRG+8mAnKLtEk2YpCtiik1UntGjsidR6w
ehqQ2lf6qEeOzS7JPNVGAfey2BA6HaSi8FvwIZtHnv3BzKftmARh569tCK/F
6LfqZps5QP1CLCrq6DttyMYvgWAkzqWaeYl2v2+/ngwWYPmak4yfnEO7Fhvt
hs7dzDNraGMjSxxFUrkJBmaXTJWb+p0QhZqAsF7+0c1LEU3V+A3Riph9UFQP
hKMuDXNCtFRZsU3pstl2+xuSXfrhy2HJcIvnlGvKwpxlDPnkeLerRNmtw7o3
9B0mwc6Q+BXX547SVueQ8+9aaoD3wkuJvRMakDNwiAg6+f3IPQ==
=BRNT
-----END PGP MESSAGE-----`,
        TransactionTime: '',
        HashedTransactionID: 'UI9Ip7pEeHkdWPWZI+Pd8cYaaJmnumuDGUzdX+OZ6l0=',
        Label: null,
        ExchangeRate: null,
        Subject: null,
        Body: null,
        ToList: null,
        Sender: null,
        IsPrivate: 0,
        IsSuspicious: 0,
        Type: 'ExternalReceive',
    },
    {
        WalletID: '01',
        WalletAccountID: '001',
        ID: '0002',
        TransactionID: `-----BEGIN PGP MESSAGE-----

wcBMA5fAXxAlQaycAQgAgr5lvL3k96n4gU01hTA7dnYnQd/gxIYzXkaIpaq5
ffcl8fwPlpAuEYdlUtUZ79SdzgG5YcYSYblvX6dfmFyGbHeumWbvVZn3OJ0I
sBRWvH0UzH3TFyboajhz17NxMpvW8TVZ23K4ZDjajk3E699l9pLfTe0G9lGM
CVXs25Tz3S6r1M+ilVPy/C60p7Cs2BBQSCWNU3zbDrv54BaLWDf/yhaum9gQ
Qaqd3XnotW5e8OVPXFp0QJwnsfLuY3mJ1TJzQU89geG+FjJta6wR58k3ASpB
E4RtOc3Ox/22GCZlW+z2vec5O89ZTp3n6JDVic5woz95cDGQQLbrABZLc/EJ
RtLA9gHxR1rd1j0GRHeLtJ9GpT0Hde30wh095bdd1jy45Qf/fjeJXxR359kX
7vAt5GkcArRVU1nlTok+Ddy2UXDduv9U+jRSPCZJ6uwB4qijXnp/SKdmTX25
jMo4r1g7fC/11SzMLOocAv/Ox6XB39wMSxyjb56S8LEccjHPLuBnCoyIrQI/
X3DK9QOzNZV/RksLjbJ3r+W0vSEC8WVxXpBYzpnql9eNBhMCH8pyvQvr12/I
sqRPDrsUdLmkHHMss73gFUqzdKvLrP3Y6mLppzq1HrMCuPQMWYcFJNEN6xMj
sS81a0aGWLxA/RTH+FE9Lu8Www5lWCF4l795JkKknzOfMYiTVHHZun1OwDDT
Fz5TmrZkKydBbZxinfyR+6zT3wwTVHYCOFZLgypu+644FMQ2001QB0KN/1PD
jqr5Rnq3s+NkI9RceVCVJDHgqZh66/zj5/1979rJSx6lMmtc63UyCxqbsjHR
znXoFKsL7ZgX2e8CxVO0j7zb/3BtyvCcxBaD0VBzotf4bS/4xY9JqzSiCL0K
FbEaKeH1aHQSHNOHPK3UgFHx05sjsjnJpJ8lGvxJzRWfGmOJCQ==
=v5Fj
-----END PGP MESSAGE-----`,
        TransactionTime: '',
        HashedTransactionID: 'zaJHG6kJW4d47QqMPr4pE9ysbl8EwIpzSOxByubrQrc=',
        Label: null,
        ExchangeRate: null,
        Subject: null,
        Body: null,
        ToList: null,
        Sender: null,
        IsPrivate: 0,
        IsSuspicious: 0,
        Type: 'ExternalReceive',
    },
    {
        WalletID: '01',
        WalletAccountID: '001',
        ID: '0003',
        TransactionID: `-----BEGIN PGP MESSAGE-----

wcBMA5fAXxAlQaycAQf/URoX0CIQ/1LtfYXiVGXN35lfd46JNj8MSJW/8Tun
i5EUAPfpatHrQVInfXPnuhPMo0CvG7ReSfJXp6vm0wGa1ym+e4Msh/Nmm9WI
S4jc1jehG8l2X2AyOjMyDw7Fb8SJUu9IZUjZ9/aFXQy2EbU6JMyaJjDze4Rp
+MufV1IMLvzCYoPM126HBFqe+VWAiIfPwz9tstNGmwwLH5OIi5YuLYcH8gGT
GlB3jEkoGX/s3292MMOVgG8Hy0lE4yBDaHNsWnv1hyRWdiflEPf2NIGcSzOS
qec6txi9AvEMzBiaTTk/9+dAoOdr443/oiS1Y101yxfYDLHXNjeDFUjUb39J
r9LA9gEJ2EkCXnC57CrHP2VyR7CGQJLxfSVRVCzYWx9RvHm5fcqA9TIJ32aM
J3WIhdyGxXX2Z2zprme2LMGuzjLKmxmgP4+lDc3e5AurIM6fMNULiEElIiqn
qu9BtaxmeGi+4hgTn+W2tg3GikE/cpD/l6XvKhVqZsxR+tgBsem3uS1Is/vg
OzS4hJaVfLbFZfdyrCOT3q513VZd6FCoW7QFO8DRC/doyfSlmR0h673tlZmG
65MZWgUeTaI20s5B5Ao1lEQCRVMoNUX42VuwitLekk0GBP6IKKAZfe58aAY2
Hc3xFaipIDwV6GpehDHlb1WvTSXX8Rn9d4kqR02sqft6aQRovX2ekWTLgk3f
VgS8sEb1jkJq4lF4qgulILbfIz9viwz7GCeitnHlSyMRH3ixQ9bGDzJr1tZI
l8UwJoGe+tfYDo00RGjqhdf02CO3sDeOWHuelQIxmWsP7DCoDeJumlgOY0Hh
8QK63vTtXuA8QV5z6D5NC+mFbljl9+6cSUliDpZ6TGVonzVPFu2qwMfWcHcO
zTy3ydb5qp51qfSnrOxWqyY/VvnRk97PIeysGWSCERueUzfp8Q==
=J2+C
-----END PGP MESSAGE-----`,
        TransactionTime: '',
        HashedTransactionID: 'U6oey3/f1qlaZOpQJcQp7Jt7UhEbK+0Uk38XCJYevkc=',
        Label: null,
        ExchangeRate: null,
        Subject: null,
        Body: null,
        ToList: null,
        Sender: null,
        IsPrivate: 0,
        IsSuspicious: 0,
        Type: 'ExternalReceive',
    },
];

const otherTx: WasmApiWalletTransaction = {
    WalletID: '01',
    WalletAccountID: '001',
    ID: '004',
    TransactionID: `-----BEGIN PGP MESSAGE-----

wcBMA5fAXxAlQaycAQf+ImtnPQA9AIfehOuL6F35or9P1Wm4PRLAzfZHZW/W
6aMm0xZ6BjHuNhBzY4JuXTVWlDw+Qp9067ZW/uBYozBgmLEgWE8/x6Cy7p0Z
zo7F6LaZL9imB/gocSqYYm/KmMxzlrRvN1Y7vtFDdV94vV+Bvwy4iey9Irqq
E0XPFLBO2gwtr7hpf8tPESPChzoKaPiQLIyxw0CbnMbPQ8B+Gi6Yb3DZuCtO
1Cqsm0pXJSJNVvLoLyUga5XFs4PxPxJ0KHafC1vO8wX5nahyINH/qqu6jUFk
dMj7qXxdGbCh7b+xkGs4TkOt07WjHjk/JhoOUGhGDnjFD7iI4OlsUh1c/zVw
ANLA9gGT0NokKzunSYJQdNmFexXLqZ6KMNtk+nXPlRI2bp0Jg3YLiaFfZCtF
ubUfXawrHgpUiLhCvvhyWkVp5ZwEfIrEzMkCkdcy7xOOTXODq/mMaliL9+6I
y6ddgz3CIOrdD/4QQbAp7VH6IL8dw6eoBSZufZfMrDYSMXR5/jM4FJ5ZQ+cE
w6k5eUKE4mcfR6A3/hU9lnny7xM9ZZOaxvjRIea2S+73mOKJ7KSJ0FyaHCGV
ucX7NPaznv9Hk3wGHCtA2bMDmDJmHo/oO/xOY1osJ/EB2YmBA9b3WQJEh/XS
xpmvNl6eFxSqIBATh+EtnKo/guh/6hOiyJPENllaxabNdC8TQgnG6D1vI/mj
Aew6Luv124fCRQnSGGyA9cB3UaXY23PGk2apl2/QnygoOXlQuofSnuRAhl9k
b6QJtDiwI80UEaGxQYRG0SrLjq1E1Nwb08RRIW8qd6HKDXzLPpeEZsGeSp11
WMyF1EHHvm1XD4OtSXcC5JRAxApkkd7aaMXWFr0VbG0fTTQM+miGu/HMIg9k
QBT5KXMc9NeCRz1aMA3fyrySG8jmDhYaRdivUiOrIGbRVsfLAw==
=Uzuf
-----END PGP MESSAGE-----`,
    TransactionTime: '',
    HashedTransactionID: '/uNZ/drJoEhlJNAxTi+Ll+NDGjPqmCubN3Xc8yuAj7c=',
    Label: null,
    ExchangeRate: null,
    Subject: null,
    Body: null,
    ToList: null,
    Sender: null,
    IsPrivate: 0,
    IsSuspicious: 0,
    Type: 'ExternalReceive',
};

// TODO: move this to proper file
type MockedFunction<F extends (...args: any) => any> = Mock<Parameters<F>, ReturnType<F>>;

describe('useWalletTransactions', () => {
    let userKeys: DecryptedKey[] = [];
    let addressKey: { address: Address; keys: DecryptedAddressKey[] };

    const mockedGetApiWalletTransactionData: MockedFunction<ReturnType<typeof useGetApiWalletTransactionData>> =
        vi.fn();
    const mockedGetWalletTransactionsToHash: MockedFunction<WasmWalletClient['getWalletTransactionsToHash']> = vi.fn();
    const mockedCreateWalletTransaction: MockedFunction<WasmWalletClient['createWalletTransaction']> = vi.fn();
    const mockedUpdateWalletTransactionHashedTxId: MockedFunction<
        WasmWalletClient['updateWalletTransactionHashedTxId']
    > = vi.fn();

    let wallet: IWasmApiWalletData;

    beforeAll(async () => {
        await CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());

        userKeys = await getUserKeys();

        addressKey = await getAddressKey();
        mockUseAddressKeys([[addressKey], false]);
    });

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    beforeEach(async () => {
        wallet = {
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
                MigrationRequired: 0,
            },
            WalletAccounts: [
                {
                    ID: '001',
                    Label: 'Test account',
                    WalletID: '01',
                    DerivationPath: "84'/1'/0'",
                    ScriptType: WasmScriptType.NativeSegwit,
                    FiatCurrency: 'USD',
                    LastUsedIndex: 0,
                    Priority: 1,
                    PoolSize: 0,
                    // match address defined in getAddressKey utils
                    Addresses: [{ Email: 'pro@prootn.test', ID: '0000001' }],
                },
            ],
            WalletKey: {
                WalletID: '01',
                UserKeyID: '',
                DecryptedKey: await getSymmetricKey(
                    new Uint8Array([
                        195, 144, 231, 166, 130, 1, 110, 215, 117, 236, 57, 29, 47, 122, 226, 13, 195, 81, 179, 248,
                        126, 86, 0, 117, 231, 51, 20, 99, 99, 102, 146, 36,
                    ])
                ),
                // encrypted with key in tests/fixtures/keys.ts
                // 195, 144, 231, 166, 130, 1, 110, 215, 117, 236, 57, 29, 47, 122, 226, 13, 195, 81, 179, 248, 126, 86, 0, 117, 231, 51, 20, 99, 99, 102, 146, 36
                WalletKey: `-----BEGIN PGP MESSAGE-----

wcBMA5fAXxAlQaycAQgAmX8fzNwNJBXQ0PD6aJRgXFsDx0EHrRLsQeXjnsYl
z4aVb6xbO7/llEiE343sjMSulVB47JJFFl31d6KhlkN55RI6SlsN6FHaSO4Q
wFr5GxooIQHe/+GAbCbqrWG3N5qnl1zdh8Za/mA/Hn5hVrNWb6uNWkUImd4C
yI5IrD5xSnV5o6XsLv8P/biZ4AR+FETKtSZJBNRlJaR2N5NBJAAomzLFPy+3
GaddJOYSYCoKOGvGkwgzzSK7kwtRfESfcdfA8uwrAl5lzclpgony9I2qmaNL
QjWSDYRawlMhZMAFn583PqZ6MrzC7CuOaxgeq48IntDI+B0cqZ38DQl6s1SD
C9LA1gFEukgHmM/y9a0IONeffo5RsjacBzVd0VWuw5Cb5MDu3F3AtuUUQC7O
jaKwAbfZpK+/BMp5UCV8YaPU3vXFnFBpTpivCoCvBfV1BAQexVDRk9FDiwBC
06evnZySZtn292DCTRNlU4WvRB3LC6TXa6G6VlSt2a3DldVyMK5tLnGKZPx9
Uv2kmNSF9SgcsrqwNUAQleFNWdl+UazgMIXIOreFT4gseY8VJg0gUkxLkbUI
9Xs4twjCw6r6Yogpg7vtysZ4We5CKeDOhdkuWQAOVOzlF7jZYm1NOXhWd7Ir
aQfcObHiwO1hsWlg+v19wqI3m8cHvVAzAc8kGE2S4akhWMVJ1Ejw4SibYqbk
1uIC25ClefqeP5NA5YLj3txPHYOCUGNauVbMO0qG4w83XtKC8/bhkSe/hKsy
M4oiM/pClkG7ipqm3+KZIk1hpAaOL3jfo6nRXy7Sq4EY1abROFEjp5v5T+W/
aHaP0+HtGtC7PkEN769ePScr8wwHIKj3ue3e0E/3QyHJD4oPXPcO2n8rv6U5
A6mmAJs=
=IDa0
-----END PGP MESSAGE-----`,
                WalletKeySignature: `-----BEGIN PGP SIGNATURE-----

wsCYBAABCgBMBYJmULhqCZCXwF8QJUGsnCSUgAAAAAARAApjb250ZXh0QHBy
b3Rvbi5jaHdhbGxldC5rZXkWIQQ3HbUNIAEr3zCRK0GXwF8QJUGsnAAAvZoH
/3D7BhK2D0mdecOvMXgm+dcWUeaKJMARDXCXODcHDCFVqitEPUbMksoz1NtC
pndgZSLgPPGMxFfKIrJph9sEFnX3I/sT1uJJq0rMNOeWF0iN/xKpiU2vvJVS
ugl1ejcQFGZ3Jxibh4xtbGeMUWey2r6PYQcSZTxUgO+cDKDeYpTEP71+IxeP
8ZWcLfhO1K3vs1M7vkHv+cG+VLBbrBYdaQ7tFiU0IjJ0/o/Q+rS6FS6DL/IC
CGQif+ArO3HvJ1KpJoJ21tWLJ0B8DRrgE3GPCKiGHlzcmKfKYgLKDP6tmoXn
leuf2nQGByJvgUsPBuLkNG6E9zU8oOKy6NU1FNnutwI=
=fl0k
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

        mockUseNotifications();
        mockUseBitcoinBlockchainContext({
            decryptedApiWalletsData: [wallet],
            walletMap: buildMapFromWallets([wallet]),
            accountIDByDerivationPathByWalletID: { [wallet.Wallet.ID]: { ["84'/1'/0'"]: '001' } },
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
                Sender: null,
                Subject: null,
                Body: null,
                ToList: null,
                IsPrivate: 0,
                IsSuspicious: 0,
                Type: 'ExternalReceive',
            },
            free: noop,
        }));

        mockedUpdateWalletTransactionHashedTxId.mockReset();

        mockUseWalletApiClients(
            getMockedApi({
                wallet: {
                    getWalletTransactionsToHash: mockedGetWalletTransactionsToHash,
                    createWalletTransaction: mockedCreateWalletTransaction,
                    updateWalletTransactionHashedTxId: mockedUpdateWalletTransactionHashedTxId,
                },
            })
        );
    });

    describe('when transactions is empty', () => {
        it('should not fail', async () => {
            const transactions: WasmTransactionDetails[] = [];
            const { result } = renderHook(() => useWalletTransactions({ transactions, wallet, userKeys }));
            expect(result.current.transactionDetails).toBeNull();
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
                    useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
                );

                await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                expect(result.current.transactionDetails).toStrictEqual([
                    {
                        networkData: networkTransactions[0],
                        apiData: {
                            ...apiTransactions[0],
                            ToList: {},
                            TransactionID: 'f2a58482f18a7cf245d1c588bca29ee417ee535559edd18132f15470c8377981',
                        },
                    },
                    {
                        networkData: networkTransactions[1],
                        apiData: {
                            ...apiTransactions[1],
                            ToList: {},
                            TransactionID: '68fcbc9ea42f00aae70ca047dd87363f6c3b2026e4e286a16119cabd9363661b',
                        },
                    },
                    {
                        networkData: networkTransactions[2],
                        apiData: {
                            ...apiTransactions[2],
                            ToList: {},
                            TransactionID: '5df718baf0ff146cb572d9f347881226c0d85bfc590c90c4044b847db85a20db',
                        },
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
                    useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
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
                        useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
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
                        useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
                    );

                    await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                    expect(result.current.transactionDetails).toStrictEqual([
                        {
                            networkData: networkTransactions[0],
                            apiData: {
                                ...apiTransactions[0],
                                Body: null,
                                Label: null,
                                ToList: {},
                                TransactionID: 'f2a58482f18a7cf245d1c588bca29ee417ee535559edd18132f15470c8377981',
                            },
                        },
                        {
                            networkData: networkTransactions[1],
                            apiData: {
                                ...apiTransactions[1],
                                Body: null,
                                Label: null,
                                ToList: {},
                                TransactionID: '68fcbc9ea42f00aae70ca047dd87363f6c3b2026e4e286a16119cabd9363661b',
                            },
                        },
                        {
                            networkData: networkTransactions[2],
                            apiData: {
                                ...apiTransactions[2],
                                Body: null,
                                Label: null,
                                ToList: {},
                                TransactionID: '5df718baf0ff146cb572d9f347881226c0d85bfc590c90c4044b847db85a20db',
                            },
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
                            useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
                        );

                        await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                        expect(result.current.transactionDetails).toStrictEqual([
                            {
                                networkData: networkTransactions[0],
                                apiData: {
                                    ...apiTransactions[0],
                                    ToList: {},
                                    TransactionID: 'f2a58482f18a7cf245d1c588bca29ee417ee535559edd18132f15470c8377981',
                                },
                            },
                            {
                                networkData: networkTransactions[1],
                                apiData: {
                                    ...apiTransactions[1],
                                    ToList: {},
                                    TransactionID: '68fcbc9ea42f00aae70ca047dd87363f6c3b2026e4e286a16119cabd9363661b',
                                },
                            },
                            {
                                networkData: networkTransactions[2],
                                apiData: {
                                    ...apiTransactions[2],
                                    ToList: {},
                                    TransactionID: '5df718baf0ff146cb572d9f347881226c0d85bfc590c90c4044b847db85a20db',
                                },
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

                it('should create them', async () => {
                    const { result } = renderHook(() =>
                        useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
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

                it('should set created transactions in map', async () => {
                    const { result } = renderHook(() =>
                        useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
                    );

                    await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                    expect(result.current.transactionDetails).toStrictEqual([
                        {
                            networkData: networkTransactions[0],
                            apiData: {
                                ...apiTransactions[0],
                                ToList: {},
                                TransactionID: 'f2a58482f18a7cf245d1c588bca29ee417ee535559edd18132f15470c8377981',
                            },
                        },
                        {
                            networkData: networkTransactions[1],
                            apiData: {
                                ...apiTransactions[1],
                                ToList: {},
                                TransactionID: '68fcbc9ea42f00aae70ca047dd87363f6c3b2026e4e286a16119cabd9363661b',
                            },
                        },
                        {
                            networkData: networkTransactions[2],
                            apiData: {
                                ...apiTransactions[2],
                                ToList: {},
                                TransactionID: '5df718baf0ff146cb572d9f347881226c0d85bfc590c90c4044b847db85a20db',
                            },
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
                            useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
                        );

                        await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                        expect(result.current.transactionDetails).toStrictEqual([
                            {
                                networkData: networkTransactions[0],
                                apiData: {
                                    ...apiTransactions[0],
                                    ToList: {},
                                    TransactionID: 'f2a58482f18a7cf245d1c588bca29ee417ee535559edd18132f15470c8377981',
                                },
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

            it('should update them', async () => {
                const { result } = renderHook(() =>
                    useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
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
                    '/uNZ/drJoEhlJNAxTi+Ll+NDGjPqmCubN3Xc8yuAj7c='
                );
            });

            it('should not add transaction to the map', async () => {
                const { result } = renderHook(() =>
                    useWalletTransactions({ transactions: networkTransactions, wallet, userKeys })
                );

                // map init
                await waitFor(() => expect(result.current.loadingRecordInit).toBeFalsy());
                expect(result.current.transactionDetails?.length).toStrictEqual(3);

                // map completion
                await waitFor(() => expect(result.current.loadingApiData).toBeFalsy());

                // after updating the other tx
                expect(mockedUpdateWalletTransactionHashedTxId).toHaveBeenCalledTimes(1);
                // other tx is not added to map
                expect(result.current.transactionDetails?.length).toStrictEqual(3);
            });
        });
    });
});
