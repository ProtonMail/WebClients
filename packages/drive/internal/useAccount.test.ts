import { ADDRESS_STATUS } from '@proton/shared/lib/constants';

import { useAccount } from './useAccount';

const mockApi = jest.fn();
const mockGetUID = jest.fn();
const mockGetAddresses = jest.fn();
const mockGetAddressKeys = jest.fn();
const mockImportPublicKey = jest.fn();

jest.mock('react', () => ({
    __esModule: true,
    useRef: jest.fn((value) => ({ current: value })),
}));

jest.mock('@proton/app-context/useApi', () => ({
    __esModule: true,
    useApi: () => mockApi,
}));

jest.mock('@proton/components/hooks/useAuthentication', () => ({
    __esModule: true,
    default: () => ({ getUID: mockGetUID }),
}));

jest.mock('@proton/account/addresses/hooks', () => ({
    __esModule: true,
    useGetAddresses: () => mockGetAddresses,
}));

jest.mock('@proton/account/addressKeys/hooks', () => ({
    __esModule: true,
    useGetAddressKeys: () => mockGetAddressKeys,
}));

jest.mock('@protontech/crypto', () => ({
    __esModule: true,
    CryptoProxy: {
        importPublicKey: (...args: unknown[]) => mockImportPublicKey(...args),
    },
}));

const ownEmail = 'me@proton.test';
const otherEmail = 'other@proton.test';

const ownAddress = {
    ID: 'address-id-own',
    Email: ownEmail,
    Status: ADDRESS_STATUS.STATUS_ENABLED,
};

const disabledOwnAddress = {
    ID: 'address-id-disabled',
    Email: 'disabled@proton.test',
    Status: ADDRESS_STATUS.STATUS_DISABLED,
};

const ownAddressKey = { ID: 'key-id-own', privateKey: { _ref: 'own-pub-key' } };
const disabledOwnAddressKey = { ID: 'key-id-disabled', privateKey: { _ref: 'disabled-pub-key' } };

describe('useAccount.getPublicKeys', () => {
    beforeEach(() => {
        mockGetUID.mockReturnValue('uid');
        mockGetAddresses.mockResolvedValue([ownAddress, disabledOwnAddress]);
        mockGetAddressKeys.mockImplementation(async (id: string) => {
            if (id === ownAddress.ID) {
                return [ownAddressKey];
            }
            if (id === disabledOwnAddress.ID) {
                return [disabledOwnAddressKey];
            }
            return [];
        });
        mockImportPublicKey.mockImplementation(async ({ armoredKey }) => ({ _ref: `imported:${armoredKey}` }));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return [] when there is no UID', async () => {
        mockGetUID.mockReturnValue('');
        const account = useAccount();

        await expect(account.getPublicKeys(ownEmail)).resolves.toEqual([]);
        expect(mockApi).not.toHaveBeenCalled();
    });

    it('should return own enabled address keys directly without an API call', async () => {
        const account = useAccount();

        const keys = await account.getPublicKeys(ownEmail);

        expect(keys).toEqual([ownAddressKey.privateKey]);
        expect(mockApi).not.toHaveBeenCalled();
    });

    it('should fetch own address keys fresh on every call, never caching them', async () => {
        const account = useAccount();

        await account.getPublicKeys(ownEmail);
        await account.getPublicKeys(ownEmail);

        // Own keys must be re-read each time so a stale account-layer key
        // cache can never leave us holding a dead key reference.
        expect(mockGetAddressKeys).toHaveBeenCalledTimes(2);
        expect(mockApi).not.toHaveBeenCalled();
    });

    it('should cache the API public keys for an external email across sequential calls', async () => {
        mockApi.mockResolvedValue({ Address: { Keys: [{ PublicKey: 'ext-armored' }] } });
        const account = useAccount();

        await account.getPublicKeys(otherEmail);
        await account.getPublicKeys(otherEmail);

        expect(mockApi).toHaveBeenCalledTimes(1);
    });

    it('should dedupe concurrent API calls for an external email', async () => {
        mockApi.mockResolvedValue({ Address: { Keys: [{ PublicKey: 'ext-armored' }] } });
        const account = useAccount();

        const [a, b] = await Promise.all([account.getPublicKeys(otherEmail), account.getPublicKeys(otherEmail)]);

        expect(a).toEqual(b);
        expect(mockApi).toHaveBeenCalledTimes(1);
    });

    it('should combine fresh own keys with cached public keys for a disabled address, own keys last', async () => {
        mockApi.mockResolvedValue({ Address: { Keys: [{ PublicKey: 'ext-armored' }] } });
        const account = useAccount();

        const keys = await account.getPublicKeys(disabledOwnAddress.Email);
        expect(keys).toEqual([{ _ref: 'imported:ext-armored' }, disabledOwnAddressKey.privateKey]);

        // The API public keys are cached, but the disabled own keys are still
        // fetched fresh on the second call.
        await account.getPublicKeys(disabledOwnAddress.Email);
        expect(mockGetAddressKeys).toHaveBeenCalledTimes(2);
        expect(mockApi).toHaveBeenCalledTimes(1);
    });

    it('should not reuse the cached promise across different emails', async () => {
        mockApi.mockResolvedValue({ Address: { Keys: [] } });
        const account = useAccount();

        await account.getPublicKeys(ownEmail);
        await account.getPublicKeys(otherEmail);

        expect(mockGetAddresses).toHaveBeenCalledTimes(2);
    });
});
