import { act, renderHook } from '@testing-library/react-hooks';

import type { User } from '@proton/shared/lib/interfaces';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import { getUserKey } from '@proton/shared/test/keys/keyDataHelper';

import { generateAddress, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../utils/test/crypto';
import { useSharesStore } from '../../../zustand/share/shares.store';
import { VolumesStateProvider } from '../../_volumes/useVolumesState';
import type { LockedVolumeForRestore } from '../interface';
import { ShareType } from '../interface';
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
        return {
            preventLeave: (wrapper: any) => (typeof wrapper === 'function' ? wrapper() : Promise.resolve(wrapper)),
        };
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
    defaultShares: [SHARE_MOCK_1],
    devices: [],
    photos: [],
};

const LOCKED_VOLUME_MOCK_2 = {
    lockedVolumeId: 'volumeId2',
    defaultShares: [SHARE_MOCK_2],
    devices: [],
    photos: [],
};

const mockGetLockedShares = jest.fn();
const mockGetShareWithKey = jest.fn();

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
        getShareWithKey: jest.fn(),
        addressesKeys: [],
        getDefaultShare: jest.fn(),
        getDefaultPhotosShare: jest.fn(),
        getOwnAddressAndPrimaryKeys: jest.fn(),
        prepareVolumeForRestore: jest.fn(),
        getLinkPrivateKey: jest.fn(),
        getLinkHashKey: jest.fn(),
        createPhotosWithAlbumsShare: jest.fn(),
        ...props,
    });
};

describe('useLockedVolume', () => {
    const abortSignal = new AbortController().signal;
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
        mockRequest.mockResolvedValue({ Volume: { Type: VolumeType.Regular } });

        const { result } = renderHook(() => useSharesStore());
        act(() => {
            result.current.setLockedVolumesForRestore([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2]);
        });
    });

    describe('prepareVolumesForRestore', () => {
        it("should return locked volumes if there's no private keys associated with address", async () => {
            const { result } = renderHook(() => useHook(), { wrapper });

            const res = await result.current.prepareVolumesForRestore(abortSignal);
            expect(res).toMatchObject([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2]);
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

            const res = await result.current.prepareVolumesForRestore(abortSignal);
            expect(res).toMatchObject([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2]);
        });

        it("should return locked volumes if there's no new prepared shares", async () => {
            mockGetLockedShares.mockImplementation(() => {
                return [{ defaultShares: [{ shareId: 'shareId' }], devices: [], photos: [] }];
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

            const res = await result.current.prepareVolumesForRestore(abortSignal);
            expect(res).toMatchObject([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2]);
        });

        it('should return extended volume list with new prepared volumes', async () => {
            const lockedVolumeForRestore = {
                lockedVolumeId: 'volumeId',
                defaultShares: [
                    {
                        shareId: 'shareId',
                        linkDecryptedPassphrase: 'passphrase',
                    },
                ],
            } as LockedVolumeForRestore;

            const { result: resultShareStore } = renderHook(() => useSharesStore());
            act(() => {
                resultShareStore.current.setLockedVolumesForRestore([
                    LOCKED_VOLUME_MOCK_1,
                    LOCKED_VOLUME_MOCK_2,
                    lockedVolumeForRestore,
                ]);
            });

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

            await act(async () => {
                const res = await result.current.prepareVolumesForRestore(abortSignal);
                expect(res).toMatchObject([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2, lockedVolumeForRestore]);
            });
        });

        describe('hook return values', () => {
            it('should return correct initial state values', () => {
                const { result } = renderHook(() => useHook(), { wrapper });

                expect(result.current.isReadyForPreparation).toBe(false);
                expect(result.current.lockedVolumesCount).toBe(0);
                expect(result.current.hasLockedVolumes).toBe(0);
                expect(result.current.hasVolumesForRestore).toBe(true); // We have mocked volumes
            });

            it('should indicate ready for preparation when addressesKeys and locked shares exist', () => {
                const addressesKeys = [{ address: { ID: 'address1' }, keys: [] }];
                const { result: storeResult } = renderHook(() => useSharesStore());

                // Set up locked shares in the store
                act(() => {
                    storeResult.current.setShares([
                        {
                            shareId: 'shareId1',
                            volumeId: 'volumeId1',
                            isLocked: true,
                            isDefault: true,
                            type: ShareType.default,
                            volumeType: VolumeType.Regular,
                        } as any,
                    ]);
                });

                const { result } = renderHook(
                    () =>
                        useHook({
                            addressesKeys,
                        }),
                    { wrapper }
                );

                expect(result.current.isReadyForPreparation).toBe(true);
                expect(result.current.lockedVolumesCount).toBe(1);
                expect(result.current.hasLockedVolumes).toBe(1);
            });

            it('should not be ready for preparation when addressesKeys is empty', () => {
                const { result: storeResult } = renderHook(() => useSharesStore());

                // Set up locked shares in the store
                act(() => {
                    storeResult.current.setShares([
                        {
                            shareId: 'shareId1',
                            volumeId: 'volumeId1',
                            isLocked: true,
                            isDefault: true,
                            type: ShareType.default,
                            volumeType: VolumeType.Regular,
                        } as any,
                    ]);
                });

                const { result } = renderHook(() => useHook({ addressesKeys: [] }), { wrapper });

                expect(result.current.isReadyForPreparation).toBe(false);
            });

            it('should not be ready for preparation when no locked shares exist', () => {
                const addressesKeys = [{ address: { ID: 'address1' }, keys: [] }];
                const { result: storeResult } = renderHook(() => useSharesStore());

                // Ensure no locked shares (set unlocked shares)
                act(() => {
                    storeResult.current.setShares([
                        {
                            shareId: 'shareId1',
                            volumeId: 'volumeId1',
                            isLocked: false,
                            isDefault: true,
                            type: ShareType.default,
                            volumeType: VolumeType.Regular,
                        } as any,
                    ]);
                });

                const { result } = renderHook(
                    () =>
                        useHook({
                            addressesKeys,
                        }),
                    { wrapper }
                );

                expect(result.current.isReadyForPreparation).toBe(false);
                expect(result.current.lockedVolumesCount).toBe(0);
            });
        });

        describe('deleteLockedVolumes', () => {
            it('should handle deletion when no locked shares exist', async () => {
                const { result } = renderHook(() => useHook(), { wrapper });

                await act(async () => {
                    await result.current.deleteLockedVolumes();
                });

                // Should not throw error when no shares to delete
                expect(result.current.lockedVolumesCount).toBe(0);
            });
        });

        describe('restoreVolumes', () => {
            it('should handle restore operation with no volumes to restore', async () => {
                const mockPrepareVolumeForRestore = jest.fn().mockResolvedValue(LOCKED_VOLUME_MOCK_1);
                const mockCreatePhotosWithAlbumsShare = jest.fn().mockResolvedValue({ shareId: 'photosShare' });
                const addressesKeys = await generateAddressKeys();

                const { result } = renderHook(
                    () =>
                        useHook({
                            addressesKeys,
                            prepareVolumeForRestore: mockPrepareVolumeForRestore,
                            createPhotosWithAlbumsShare: mockCreatePhotosWithAlbumsShare,
                        }),
                    { wrapper }
                );

                const { result: storeResult } = renderHook(() => useSharesStore());
                act(() => {
                    storeResult.current.setLockedVolumesForRestore([]);
                });

                await act(async () => {
                    const resultValue = await result.current.restoreVolumes(abortSignal);
                    expect(resultValue).toBe(false);
                });
            });

            it('should handle API errors during restore operation', async () => {
                // Mock request to fail for volume query
                mockRequest.mockRejectedValue(new Error('API Error'));
                const mockPrepareVolumeForRestore = jest.fn().mockResolvedValue(LOCKED_VOLUME_MOCK_1);
                const mockCreatePhotosWithAlbumsShare = jest.fn().mockResolvedValue({ shareId: 'photosShare' });
                const addressesKeys = await generateAddressKeys();

                const { result: storeResult } = renderHook(() => useSharesStore());
                act(() => {
                    storeResult.current.setLockedVolumesForRestore([LOCKED_VOLUME_MOCK_1]);
                });

                const { result } = renderHook(
                    () =>
                        useHook({
                            addressesKeys,
                            prepareVolumeForRestore: mockPrepareVolumeForRestore,
                            createPhotosWithAlbumsShare: mockCreatePhotosWithAlbumsShare,
                        }),
                    { wrapper }
                );

                await expect(
                    act(async () => {
                        await result.current.restoreVolumes(abortSignal);
                    })
                ).rejects.toThrow('API Error');
            });
        });

        describe('error handling', () => {
            it('should handle errors in prepareVolumesForRestore gracefully', async () => {
                const mockGetShareWithKey = jest.fn().mockRejectedValue(new Error('Network error'));
                const addressesKeys = await generateAddressKeys();
                const { result } = renderHook(
                    () =>
                        useHook({
                            addressesKeys,
                            getShareWithKey: mockGetShareWithKey,
                        }),
                    { wrapper }
                );

                const res = await result.current.prepareVolumesForRestore(abortSignal);
                expect(res).toMatchObject([LOCKED_VOLUME_MOCK_1, LOCKED_VOLUME_MOCK_2]);
            });

            it('should handle undefined addressesKeys', () => {
                const { result } = renderHook(() => useHook({ addressesKeys: undefined }), { wrapper });

                expect(result.current.isReadyForPreparation).toBe(false);
                expect(result.current.lockedVolumesCount).toBe(0);
            });

            it('should handle missing default share gracefully', async () => {
                const mockGetDefaultShare = jest.fn().mockResolvedValue(undefined);
                const mockCreatePhotosWithAlbumsShare = jest.fn().mockResolvedValue({ shareId: 'photosShare' });
                const addressesKeys = await generateAddressKeys();

                const { result: storeResult } = renderHook(() => useSharesStore());
                act(() => {
                    storeResult.current.setLockedVolumesForRestore([LOCKED_VOLUME_MOCK_1]);
                });

                const { result } = renderHook(
                    () =>
                        useHook({
                            addressesKeys,
                            getDefaultShare: mockGetDefaultShare,
                            createPhotosWithAlbumsShare: mockCreatePhotosWithAlbumsShare,
                        }),
                    { wrapper }
                );

                await act(async () => {
                    const resultValue = await result.current.restoreVolumes(abortSignal);
                    expect(resultValue).toBe(false);
                });
            });
        });

        describe('shares store integration', () => {
            it('should reflect changes in locked volumes count when store updates', () => {
                const { result: hookResult } = renderHook(() => useHook(), { wrapper });
                const { result: storeResult } = renderHook(() => useSharesStore());

                expect(hookResult.current.lockedVolumesCount).toBe(0);
                expect(hookResult.current.hasVolumesForRestore).toBe(true);

                act(() => {
                    storeResult.current.setLockedVolumesForRestore([
                        LOCKED_VOLUME_MOCK_1,
                        LOCKED_VOLUME_MOCK_2,
                        {
                            lockedVolumeId: 'volumeId3',
                            defaultShares: [{ shareId: 'shareId3', linkDecryptedPassphrase: 'passphrase' }],
                            devices: [],
                            photos: [],
                        },
                    ]);
                });

                expect(hookResult.current.hasVolumesForRestore).toBe(true);
            });

            it('should handle empty volumes for restore', () => {
                const { result: hookResult } = renderHook(() => useHook(), { wrapper });
                const { result: storeResult } = renderHook(() => useSharesStore());

                act(() => {
                    storeResult.current.setLockedVolumesForRestore([]);
                });

                expect(hookResult.current.hasVolumesForRestore).toBe(false);
            });
        });
    });
});
