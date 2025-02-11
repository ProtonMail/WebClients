import type { LockedVolumeForRestore, Share } from '../../store';
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
    isVolumeSoftDeleted: false,
    creator: 'mock',
    possibleKeyPackets: [],
    createTime: Date.now(),
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

    describe('getLockedShares', () => {
        it('should return locked default shares with their associated devices and photos', () => {
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

            const result = useSharesStore.getState().getLockedShares();
            expect(result).toEqual([
                {
                    defaultShare,
                    devices: [deviceShare],
                    photos: [photosShare],
                },
            ]);
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
