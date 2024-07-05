import { renderHook } from '@testing-library/react-hooks';

import { WasmApiBitcoinAddressesCreationPayload, WasmDerivationPath } from '@proton/andromeda';
import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import {
    mockUseAuthentication,
    mockUseGetAddresses,
    mockUseGetOrganization,
    mockUseGetUserKeys,
    mockUseUser,
} from '@proton/testing/lib/vitest';

import {
    apiWalletAccountOneA,
    apiWalletsData,
    expectSignedBy,
    getAddressKey,
    getMockedApi,
    getUserKeys,
    mockUseGetBitcoinNetwork,
    mockUseGetUserWalletSettings,
    mockUseWalletApiClients,
    userWalletSettings,
} from '../tests';
import { useWalletAutoCreate } from './useWalletAutoCreate';

vi.mock('@proton/andromeda', async () => {
    const andromeda = await vi.importActual('@proton/andromeda');
    return {
        ...andromeda,
        WasmMnemonic: vi.fn(() =>
            (andromeda.WasmMnemonic as any).fromString(
                'benefit indoor helmet wine exist height grain spot rely half beef nothing'
            )
        ),
    };
});

vi.mock('../constants/email-integration', () => ({ POOL_FILLING_THRESHOLD: 3 }));

describe('useWalletAutoCreate', () => {
    let addressWithKey: { address: Address; keys: DecryptedAddressKey[] };

    const mockedCreateWallet = vi.fn(async () => apiWalletsData[0]);
    const mockedCreateWalletAccount = vi.fn(async () => ({ Data: apiWalletAccountOneA }));
    const mockedAddEmailAddress = vi.fn();
    const mockedAddBitcoinAddress = vi.fn();
    let mockedGetUserWalletSettings: Parameters<typeof mockUseGetUserWalletSettings>[0];

    let mocked = getMockedApi({
        wallet: {
            createWallet: mockedCreateWallet as any,
            createWalletAccount: mockedCreateWalletAccount as any,
            addEmailAddress: mockedAddEmailAddress,
        },
        bitcoin_address: {
            addBitcoinAddress: mockedAddBitcoinAddress,
        },
    });

    beforeAll(async () => {
        await CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
    });

    beforeEach(async () => {
        mockedGetUserWalletSettings = vi.fn(async () => ({ ...userWalletSettings, WalletCreated: 0 }));

        mockedCreateWallet.mockClear();
        mockedCreateWalletAccount.mockClear();
        mockedAddEmailAddress.mockClear();
        mockedAddBitcoinAddress.mockClear();

        mockUseWalletApiClients(mocked);
        mockUseGetBitcoinNetwork();
        mockUseGetUserKeys(await getUserKeys());
        mockUseGetUserWalletSettings(mockedGetUserWalletSettings);
        mockUseUser();
        mockUseGetOrganization();
        mockUseAuthentication({ getPassword: vi.fn(() => 'testtest') });

        addressWithKey = await getAddressKey();
        mockUseGetAddresses([addressWithKey.address]);
    });

    describe('when user wallet has already created a wallet before', () => {
        beforeEach(() => {
            mockedGetUserWalletSettings = vi.fn(async () => ({ ...userWalletSettings, WalletCreated: 1 }));
            mockUseGetUserWalletSettings(mockedGetUserWalletSettings);
        });

        it('should not autocreate wallet', async () => {
            const { waitFor } = renderHook(() => useWalletAutoCreate());

            await waitFor(() => expect(mockedGetUserWalletSettings).toHaveBeenCalled());
            expect(mockedGetUserWalletSettings).toHaveBeenCalledWith();

            // We need to wait some time to assert no call where sent, there is no way to do such an assertion without that
            await wait(100);

            expect(mockedCreateWallet).not.toHaveBeenCalled();
        });
    });

    describe('when higher level pilot is false', () => {
        it('should not autocreate wallet', async () => {
            renderHook(() => useWalletAutoCreate({ higherLevelPilot: false }));

            // We need to wait some time to assert no call where sent, there is no way to do such an assertion without that
            await wait(100);

            expect(mockedGetUserWalletSettings).not.toHaveBeenCalled();
            expect(mockedCreateWallet).not.toHaveBeenCalled();
        });
    });

    describe('when user is not free and is part of org with > 1 max member', () => {
        beforeEach(() => {
            mockUseUser([{ isFree: false }]);
            mockUseGetOrganization({ MaxMembers: 3 });
        });

        it('should not autocreate wallet', async () => {
            renderHook(() => useWalletAutoCreate());

            // We need to wait some time to assert no call where sent, there is no way to do such an assertion without that
            await wait(100);

            expect(mockedGetUserWalletSettings).not.toHaveBeenCalled();
            expect(mockedCreateWallet).not.toHaveBeenCalled();
        });
    });

    describe('when user has not created a wallet yet', () => {
        it('should autocreate wallet', async () => {
            const [primaryKey] = addressWithKey.keys;
            const { waitFor } = renderHook(() => useWalletAutoCreate());

            await waitFor(() => expect(mockedCreateWallet).toHaveBeenCalled());

            expect(mockedGetUserWalletSettings).toHaveBeenCalled();
            expect(mockedGetUserWalletSettings).toHaveBeenCalledWith();

            expect(mockedCreateWallet).toHaveBeenCalledWith(
                expect.any(String),
                false,
                1,
                false,
                'WALLET_TEST',
                expect.any(String),
                expect.any(String),
                expect.any(String),
                expect.any(String),
                undefined,
                true
            );

            await waitFor(() => expect(mockedCreateWalletAccount).toHaveBeenCalled());
            expect(mockedCreateWalletAccount).toHaveBeenCalledWith(
                '0',
                // TODO: check derivation path when toString is impl for WasmDerivationPath
                expect.any(WasmDerivationPath),
                expect.any(String),
                3
            );

            await waitFor(() => expect(mockedAddEmailAddress).toHaveBeenCalled());
            expect(mockedAddEmailAddress).toHaveBeenCalledWith('0', '8', '0000001');

            // Check if bitcoin address pool was filled
            await waitFor(() => expect(mockedAddBitcoinAddress).toHaveBeenCalled());
            expect(mockedAddBitcoinAddress).toHaveBeenCalledTimes(1);
            expect(mockedAddBitcoinAddress).toHaveBeenCalledWith(
                '0',
                '8',
                expect.any(WasmApiBitcoinAddressesCreationPayload)
            );

            const bitcoinAddressesPayload = mockedAddBitcoinAddress.mock.calls[0][2];
            const bitcoinAddressesPayloadInner = bitcoinAddressesPayload[0];

            expect(bitcoinAddressesPayloadInner[0].Data).toStrictEqual({
                BitcoinAddress: 'tb1q9zt888mn6ujzz3xkrsf8v73ngslfxgwqkng0lq',
                BitcoinAddressIndex: 0,
                BitcoinAddressSignature: expect.any(String),
            });
            await expectSignedBy(
                primaryKey,
                bitcoinAddressesPayloadInner[0].Data.BitcoinAddress,
                bitcoinAddressesPayloadInner[0].Data.BitcoinAddressSignature
            );

            expect(bitcoinAddressesPayloadInner[1].Data).toStrictEqual({
                BitcoinAddress: 'tb1qlsckafxe0v6xe8kt94svx77ld38qw2yhz7cakz',
                BitcoinAddressIndex: 1,
                BitcoinAddressSignature: expect.any(String),
            });
            await expectSignedBy(
                primaryKey,
                bitcoinAddressesPayloadInner[1].Data.BitcoinAddress,
                bitcoinAddressesPayloadInner[1].Data.BitcoinAddressSignature
            );

            expect(bitcoinAddressesPayloadInner[2].Data).toStrictEqual({
                BitcoinAddress: 'tb1qelseqz73w6p65s4a2pmfm0w48tjsvp54u2v9k3',
                BitcoinAddressIndex: 2,
                BitcoinAddressSignature: expect.any(String),
            });
            await expectSignedBy(
                primaryKey,
                bitcoinAddressesPayloadInner[2].Data.BitcoinAddress,
                bitcoinAddressesPayloadInner[2].Data.BitcoinAddressSignature
            );
        });
    });
});
