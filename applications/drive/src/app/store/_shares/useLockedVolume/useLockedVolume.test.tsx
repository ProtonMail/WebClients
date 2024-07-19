import { act, renderHook } from '@testing-library/react-hooks';

import type { User } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import { getUserKey } from '@proton/shared/test/keys/keyDataHelper';

import { generateAddress, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../utils/test/crypto';
import { VolumesStateProvider } from '../../_volumes/useVolumesState';
import type { LockedVolumeForRestore } from '../interface';
import type useSharesState from '../useSharesState';
import type useLockedVolume from './useLockedVolume';
import { useLockedVolumeInner } from './useLockedVolume';

const mockRequest = jest.fn();
jest.mock('../../_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockRequest;
    };
    return useDebouncedRequest;
});

jest.mock('../../_utils/useDebouncedFunction', () => {
    const useDebouncedFunction = () => {
        return (wrapper: any) => wrapper();
    };
    return useDebouncedFunction;
});

jest.mock('@proton/components/hooks/usePreventLeave', () => {
    const usePreventLeave = () => {
        return (wrapper: any) => wrapper();
    };
    return usePreventLeave;
});

const SHARE_MOCK_1 = {
    shareId: 'shareId1',
    lockedVolumeId: 'volumeId1',
    linkDecryptedPassphrase: 'passphrase',
};

const SHARE_MOCK_2 = {
    shareId: 'shareId2',
    lockedVolumeId: 'volumeId2',
    linkDecryptedPassphrase: 'passphrase',
};

const LOCKED_VOLUME_MOCK_1 = {
    lockedVolumeId: 'volumeId1',
    defaultShare: SHARE_MOCK_1,
    devices: [],
    photos: [],
};

const LOCKED_VOLUME_MOCK_2 = {
    lockedVolumeId: 'volumeId2',
    defaultShare: SHARE_MOCK_2,
    devices: [],
    photos: [],
};

const mockGetLockedShares = jest.fn();
const mockGetShareWithKey = jest.fn();
const sharesStateMock: ReturnType<typeof useSharesState> = {
    getLockedShares: mockGetLockedShares,
    removeShares: jest.fn(),
    setShares: jest.fn(),
    getShare: jest.fn(),
    getDefaultShareId: jest.fn(),
    setLockedVolumesForRestore: jest.fn(),
    lockedVolumesForRestore: [],
    getDefaultPhotosShareId: jest.fn(),
    getRestoredPhotosShares: jest.fn(),
};

const generateAddressKeys = async () => {
    const keyPassword = 'password';
    const userKeysFull = await Promise.all([getUserKey('a', keyPassword, 2), getUserKey('b', keyPassword, 2)]);

    const UserKeys = userKeysFull.map(({ Key }) => Key);
    const User1 = {
        Keys: UserKeys.slice(0, 1),
    } as unknown as User;

    const decryptedUserKeys = await getDecryptedUserKeysHelper(User1, keyPassword);

    return [
        {
            address: await generateAddress(UserKeys, 'email@pm.me'),
            keys: decryptedUserKeys,
        },
    ];
};

const useHook = (props: any = {}) => {
    return useLockedVolumeInner({
        sharesState: sharesStateMock,
        getShareWithKey: jest.fn(),
        addressesKeys: [],
        getDefaultShare: jest.fn(),
        getOwnAddressAndPrimaryKeys: jest.fn(),
        prepareVolumeForRestore: jest.fn(),
        getLinkPrivateKey: jest.fn(),
        getLinkHashKey: jest.fn(),
        getDeviceByShareId: jest.fn(),
        ...props,
    });
};

describe('useLockedVolume', () => {
    const abortSignal = new AbortController().signal;
    let hook: {
        current: ReturnType<typeof useLockedVolume>;
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <VolumesStateProvider>{children}</VolumesStateProvider>
    );

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    beforeEach(() => {
        jest.resetAllMocks();

        mockGetLockedShares.mockImplementation(() => {
            return [];
        });
    });

    describe('prepareVolumesForRestore', () => {
        it("should return locked volumes if there's no private keys associated with address", async () => {
            const { result } = renderHook(() => useHook(), { wrapper });
            hook = result;

            sharesStateMock.lockedVolumesForRestore = [LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2];
            await act(async () => {
                const result = await hook.current.prepareVolumesForRestore(abortSignal);
                expect(result).toMatchObject([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2]);
            });
        });

        it("should return locked volumes if there's no locked unprepared shares", async () => {
            const addressesKeys = await generateAddressKeys();
            const { result } = renderHook(
                () =>
                    useHook({
                        addressesKeys,
                    }),
                { wrapper }
            );
            hook = result;

            sharesStateMock.lockedVolumesForRestore = [LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2];

            await act(async () => {
                const result = await hook.current.prepareVolumesForRestore(abortSignal);
                expect(result).toMatchObject([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2]);
            });
        });

        it("should return locked volumes if there's no new prepared shares", async () => {
            mockGetLockedShares.mockImplementation(() => {
                return [{ defaultShare: { shareId: 'shareId' }, devices: [], photos: [] }];
            });
            mockGetShareWithKey.mockImplementation(() => {
                return [{ shareId: 'shareId' }];
            });
            const addressesKeys = await generateAddressKeys();
            const { result } = renderHook(
                () =>
                    useHook({
                        addressesKeys,
                        getShareWithKey: mockGetShareWithKey,
                    }),
                { wrapper }
            );
            hook = result;

            sharesStateMock.lockedVolumesForRestore = [LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2];

            await act(async () => {
                const result = await hook.current.prepareVolumesForRestore(abortSignal);
                expect(result).toMatchObject([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2]);
            });
        });

        it('should return extended volume list with new prepared volumes', async () => {
            mockGetLockedShares.mockImplementation(() => {
                return [{ defaultShare: { shareId: 'shareId' }, devices: [], photos: [] }];
            });
            mockGetShareWithKey.mockImplementation(() => {
                return [{ shareId: 'shareId' }];
            });

            const lockedVolumeForRestore = {
                lockedVolumeId: 'volumeId',
                defaultShare: {
                    shareId: 'shareId',
                    linkDecryptedPassphrase: 'passphrase',
                },
            } as LockedVolumeForRestore;

            const addressesKeys = await generateAddressKeys();

            const { result } = renderHook(
                () =>
                    useHook({
                        addressesKeys,
                        getShareWithKey: mockGetShareWithKey,
                        prepareVolumeForRestore: async () => lockedVolumeForRestore,
                    }),
                { wrapper }
            );
            hook = result;

            sharesStateMock.lockedVolumesForRestore = [LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2];

            await act(async () => {
                const result = await hook.current.prepareVolumesForRestore(abortSignal);
                expect(result).toMatchObject([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2, lockedVolumeForRestore]);
            });
        });
    });
});
