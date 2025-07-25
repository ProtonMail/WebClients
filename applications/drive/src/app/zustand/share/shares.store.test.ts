import type { LockedVolumeForRestore, Share, ShareWithKey } from '../../store';
import { ShareState, ShareType } from '../../store';
import { findDefaultPhotosShareId, findDefaultShareId, useSharesStore } from './shares.store';

const createTestShare = (overrides: Partial<Share> = {}): Share => ({
    shareId: 'test-share-id',
    volumeId: 'test-volume-id',
    rootLinkId: '123456',
    type: ShareType.default,
    state: ShareState.active,
    isLocked: false,
    isDefault: false,
    creator: 'mock',
    possibleKeyPackets: [],
    createTime: Date.now(),
    linkType: 1,
    ...overrides,
});

describe('useSharesStore', () => {
    beforeEach(() => {
        // Clear the store before each test
        useSharesStore.setState({ shares: {}, lockedVolumesForRestore: [] });
    });

    describe('setShares', () => {
        it('should add new shares to the store', () => {
            const share1 = createTestShare({ shareId: 'share1' });
            const share2 = createTestShare({ shareId: 'share2' });

            useSharesStore.getState().setShares([share1, share2]);

            const result = useSharesStore.getState().shares;
            expect(result).toEqual({
                share1,
                share2,
            });
        });

        it('should update existing shares', () => {
            const share1 = createTestShare({ shareId: 'share1', isLocked: false });
            const updatedShare1 = createTestShare({ shareId: 'share1', isLocked: true });

            useSharesStore.getState().setShares([share1]);
            useSharesStore.getState().setShares([updatedShare1]);

            const result = useSharesStore.getState().shares;
            expect(result.share1.isLocked).toBe(true);
        });
    });

    describe('removeShares', () => {
        it('should remove specified shares from the store', () => {
            const share1 = createTestShare({ shareId: 'share1' });
            const share2 = createTestShare({ shareId: 'share2' });
            useSharesStore.getState().setShares([share1, share2]);

            useSharesStore.getState().removeShares(['share1']);

            const result = useSharesStore.getState().shares;
            expect(result).toEqual({ share2 });
        });

        it('should handle removing non-existent shares', () => {
            const share1 = createTestShare({ shareId: 'share1' });
            useSharesStore.getState().setShares([share1]);

            useSharesStore.getState().removeShares(['non-existent']);

            const result = useSharesStore.getState().shares;
            expect(result).toEqual({ share1 });
        });
    });

    describe('getShare', () => {
        it('should return the correct share by ID', () => {
            const share1 = createTestShare({ shareId: 'share1' });
            useSharesStore.getState().setShares([share1]);

            const result = useSharesStore.getState().getShare('share1');
            expect(result).toEqual(share1);
        });

        it('should return undefined for non-existent share ID', () => {
            const result = useSharesStore.getState().getShare('non-existent');
            expect(result).toBeUndefined();
        });
    });

    describe('getLockedSharesByVolume', () => {
        it('should return locked shares grouped by volume with their associated devices and photos', () => {
            const defaultShare = createTestShare({
                shareId: 'default1',
                volumeId: 'vol1',
                isDefault: true,
                isLocked: true,
            });
            const deviceShare = createTestShare({
                shareId: 'device1',
                volumeId: 'vol1',
                type: ShareType.device,
                isLocked: true,
            });
            const photosShare = createTestShare({
                shareId: 'photos1',
                volumeId: 'vol1',
                type: ShareType.photos,
                isLocked: true,
            });

            useSharesStore.getState().setShares([defaultShare, deviceShare, photosShare]);

            const result = useSharesStore.getState().getLockedSharesByVolume();
            const expectedMap = new Map();
            expectedMap.set('vol1', {
                defaultShares: [defaultShare],
                devices: [deviceShare],
                photos: [photosShare],
            });
            expect(result).toEqual(expectedMap);
        });
    });

    describe('getDefaultShareId', () => {
        it('should return the ID of the unlocked default share', () => {
            const defaultShare = createTestShare({
                shareId: 'default1',
                isDefault: true,
                isLocked: false,
            });
            useSharesStore.getState().setShares([defaultShare]);

            const result = useSharesStore.getState().getDefaultShareId();
            expect(result).toBe('default1');
        });

        it('should return undefined when no unlocked default share exists', () => {
            const lockedDefaultShare = createTestShare({
                shareId: 'default1',
                isDefault: true,
                isLocked: true,
            });
            useSharesStore.getState().setShares([lockedDefaultShare]);

            const result = useSharesStore.getState().getDefaultShareId();
            expect(result).toBeUndefined();
        });
    });

    describe('getDefaultPhotosShareId', () => {
        it('should return the ID of the active unlocked photos share', () => {
            const photosShare = createTestShare({
                shareId: 'photos1',
                type: ShareType.photos,
                state: ShareState.active,
                isLocked: false,
            });
            useSharesStore.getState().setShares([photosShare]);

            const result = useSharesStore.getState().getDefaultPhotosShareId();
            expect(result).toBe('photos1');
        });

        it('should return undefined when no active unlocked photos share exists', () => {
            const lockedPhotosShare = createTestShare({
                shareId: 'photos1',
                type: ShareType.photos,
                state: ShareState.active,
                isLocked: true,
            });
            useSharesStore.getState().setShares([lockedPhotosShare]);

            const result = useSharesStore.getState().getDefaultPhotosShareId();
            expect(result).toBeUndefined();
        });
    });

    describe('getRestoredPhotosShares', () => {
        it('should return all restored unlocked photos shares', () => {
            const restoredShare1 = createTestShare({
                shareId: 'photos1',
                type: ShareType.photos,
                state: ShareState.restored,
                isLocked: false,
            });
            const restoredShare2 = createTestShare({
                shareId: 'photos2',
                type: ShareType.photos,
                state: ShareState.restored,
                isLocked: false,
            });
            useSharesStore.getState().setShares([restoredShare1, restoredShare2]);

            const result = useSharesStore.getState().getRestoredPhotosShares();
            expect(result).toEqual([restoredShare1, restoredShare2]);
        });

        it('should not return locked or non-restored photos shares', () => {
            const restoredShare = createTestShare({
                shareId: 'photos1',
                type: ShareType.photos,
                state: ShareState.restored,
                isLocked: false,
            });
            const lockedShare = createTestShare({
                shareId: 'photos2',
                type: ShareType.photos,
                state: ShareState.restored,
                isLocked: true,
            });
            const activeShare = createTestShare({
                shareId: 'photos3',
                type: ShareType.photos,
                state: ShareState.active,
                isLocked: false,
            });
            useSharesStore.getState().setShares([restoredShare, lockedShare, activeShare]);

            const result = useSharesStore.getState().getRestoredPhotosShares();
            expect(result).toEqual([restoredShare]);
        });
    });

    describe('setLockedVolumesForRestore', () => {
        it('should set locked volumes for restore', () => {
            const volumes = [{ volumeId: 'vol1' }, { volumeId: 'vol2' }];
            useSharesStore.getState().setLockedVolumesForRestore(volumes as unknown as LockedVolumeForRestore[]);

            const result = useSharesStore.getState().lockedVolumesForRestore;
            expect(result).toEqual(volumes);
        });
    });
});

describe('findDefaultShareId', () => {
    it('should find the unlocked default share ID', () => {
        const shares = [
            createTestShare({ shareId: 'share1', isDefault: true, isLocked: false }),
            createTestShare({ shareId: 'share2', isDefault: false, isLocked: false }),
        ];

        const result = findDefaultShareId(shares);
        expect(result).toBe('share1');
    });

    it('should return undefined when no unlocked default share exists', () => {
        const shares = [
            createTestShare({ shareId: 'share1', isDefault: true, isLocked: true }),
            createTestShare({ shareId: 'share2', isDefault: false, isLocked: false }),
        ];

        const result = findDefaultShareId(shares);
        expect(result).toBeUndefined();
    });
});

describe('findDefaultPhotosShareId', () => {
    it('should find the active unlocked photos share ID', () => {
        const shares = [
            createTestShare({
                shareId: 'photos1',
                type: ShareType.photos,
                state: ShareState.active,
                isLocked: false,
            }),
            createTestShare({
                shareId: 'photos2',
                type: ShareType.photos,
                state: ShareState.restored,
                isLocked: false,
            }),
        ];

        const result = findDefaultPhotosShareId(shares);
        expect(result).toBe('photos1');
    });

    it('should return undefined when no active unlocked photos share exists', () => {
        const shares = [
            createTestShare({
                shareId: 'photos1',
                type: ShareType.photos,
                state: ShareState.restored,
                isLocked: false,
            }),
            createTestShare({
                shareId: 'photos2',
                type: ShareType.photos,
                state: ShareState.active,
                isLocked: true,
            }),
        ];

        const result = findDefaultPhotosShareId(shares);
        expect(result).toBeUndefined();
    });
});

describe('Promise cache operations', () => {
    beforeEach(() => {
        useSharesStore.setState({
            shares: {},
            lockedVolumesForRestore: [],
            loadUserSharesPromise: null,
            defaultSharePromise: null,
            defaultPhotosSharePromise: null,
            isLoadingShares: false,
        });
    });

    describe('loadUserSharesPromise', () => {
        it('should set and clear loadUserSharesPromise', async () => {
            const mockPromise = Promise.resolve({
                defaultShareId: 'defaultShareId',
                shares: [createTestShare()],
            });

            useSharesStore.getState().setLoadUserSharesPromise(mockPromise);
            expect(useSharesStore.getState().loadUserSharesPromise).toBe(mockPromise);

            useSharesStore.getState().clearLoadUserSharesPromise();
            expect(useSharesStore.getState().loadUserSharesPromise).toBeNull();
        });
    });

    describe('defaultSharePromise', () => {
        it('should set and clear defaultSharePromise', async () => {
            const mockShare = createTestShare({ shareId: 'default-share' }) as ShareWithKey;
            const mockPromise = Promise.resolve(mockShare);

            useSharesStore.getState().setDefaultSharePromise(mockPromise);
            expect(useSharesStore.getState().defaultSharePromise).toBe(mockPromise);

            useSharesStore.getState().clearDefaultSharePromise();
            expect(useSharesStore.getState().defaultSharePromise).toBeNull();
        });
    });

    describe('defaultPhotosSharePromise', () => {
        it('should set and clear defaultPhotosSharePromise', async () => {
            const mockShare = createTestShare({
                shareId: 'photos-share',
                type: ShareType.photos,
            }) as ShareWithKey;
            const mockPromise = Promise.resolve(mockShare);

            useSharesStore.getState().setDefaultPhotosSharePromise(mockPromise);
            expect(useSharesStore.getState().defaultPhotosSharePromise).toBe(mockPromise);

            useSharesStore.getState().clearDefaultPhotosSharePromise();
            expect(useSharesStore.getState().defaultPhotosSharePromise).toBeNull();
        });

        it('should handle undefined result in defaultPhotosSharePromise', async () => {
            const mockPromise = Promise.resolve(undefined);

            useSharesStore.getState().setDefaultPhotosSharePromise(mockPromise);
            expect(useSharesStore.getState().defaultPhotosSharePromise).toBe(mockPromise);

            const result = await useSharesStore.getState().defaultPhotosSharePromise;
            expect(result).toBeUndefined();
        });
    });

    describe('isLoadingShares flag', () => {
        it('should set and check isLoadingShares', () => {
            expect(useSharesStore.getState().isLoadingShares).toBe(false);

            useSharesStore.getState().setIsLoadingShares(true);
            expect(useSharesStore.getState().isLoadingShares).toBe(true);

            useSharesStore.getState().setIsLoadingShares(false);
            expect(useSharesStore.getState().isLoadingShares).toBe(false);
        });
    });

    describe('Promise cache coordination', () => {
        it('should maintain separate caches for different promise types', async () => {
            const sharesPromise = Promise.resolve({ defaultShareId: 'defaultShareId', shares: [createTestShare()] });
            const defaultSharePromise = Promise.resolve(createTestShare({ isDefault: true }) as ShareWithKey);
            const photosSharePromise = Promise.resolve(
                createTestShare({
                    type: ShareType.photos,
                }) as ShareWithKey
            );

            useSharesStore.getState().setLoadUserSharesPromise(sharesPromise);
            useSharesStore.getState().setDefaultSharePromise(defaultSharePromise);
            useSharesStore.getState().setDefaultPhotosSharePromise(photosSharePromise);

            expect(useSharesStore.getState().loadUserSharesPromise).toBe(sharesPromise);
            expect(useSharesStore.getState().defaultSharePromise).toBe(defaultSharePromise);
            expect(useSharesStore.getState().defaultPhotosSharePromise).toBe(photosSharePromise);

            useSharesStore.getState().clearLoadUserSharesPromise();
            expect(useSharesStore.getState().loadUserSharesPromise).toBeNull();
            expect(useSharesStore.getState().defaultSharePromise).toBe(defaultSharePromise);
            expect(useSharesStore.getState().defaultPhotosSharePromise).toBe(photosSharePromise);
        });
    });

    describe('Subscribe to cache changes', () => {
        it('should notify subscribers when isLoadingShares changes', () => {
            const mockFn = jest.fn();

            const unsubscribe = useSharesStore.subscribe((state) => {
                mockFn(state.isLoadingShares);
            });

            useSharesStore.getState().setIsLoadingShares(true);

            expect(mockFn).toHaveBeenCalledWith(true);

            unsubscribe();
        });
    });
});
