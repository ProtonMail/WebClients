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

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: () => mockApi,
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

    it('should dedupe concurrent calls for the same email', async () => {
        const account = useAccount();

        const [a, b] = await Promise.all([account.getPublicKeys(ownEmail), account.getPublicKeys(ownEmail)]);

        expect(a).toBe(b);
        expect(mockGetAddresses).toHaveBeenCalledTimes(1);
    });

    it('should reuse the cached promise across sequential calls', async () => {
        const account = useAccount();

        await account.getPublicKeys(ownEmail);
        await account.getPublicKeys(ownEmail);

        expect(mockGetAddresses).toHaveBeenCalledTimes(1);
        expect(mockApi).not.toHaveBeenCalled();
    });

    it('should not reuse the cached promise across different emails', async () => {
        mockApi.mockResolvedValue({ Address: { Keys: [] } });
        const account = useAccount();

        await account.getPublicKeys(ownEmail);
        await account.getPublicKeys(otherEmail);

        expect(mockGetAddresses).toHaveBeenCalledTimes(2);
    });
});
