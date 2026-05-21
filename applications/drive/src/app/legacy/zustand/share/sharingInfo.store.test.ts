import { MemberRole, type ShareResult, splitPublicLinkUid } from '@proton/drive/index';

import { mapShareResultToSharingInfo, useSharingInfoStore } from './sharingInfo.store';

jest.mock('@proton/drive/index');

const mockSplitPublicLinkUid = jest.mocked(splitPublicLinkUid);

const mockedBaseShareResult: ShareResult = {
    members: [],
    protonInvitations: [],
    nonProtonInvitations: [],
    editorsCanShare: false,
};

describe('mapShareResultToSharingInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return undefined when shareResult is undefined', () => {
        const result = mapShareResultToSharingInfo(undefined);
        expect(result).toBeUndefined();
    });

    it('should return undefined when shareResult has no publicLink', () => {
        const result = mapShareResultToSharingInfo(mockedBaseShareResult);
        expect(result).toBeUndefined();
    });

    it('should map shareResult with publicLink correctly', () => {
        const mockShareId = 'share-123';
        const mockPublicLinkId = 'link-456';

        mockSplitPublicLinkUid.mockReturnValue({
            shareId: mockShareId,
            publicLinkId: mockPublicLinkId,
        });

        const shareResult: ShareResult = {
            ...mockedBaseShareResult,
            publicLink: {
                uid: 'share-123~link-456',
                url: 'https://drive.proton.me/urls/abc123',
                creationTime: new Date('2023-01-01T00:00:00Z'),
                expirationTime: new Date('2025-12-31T23:59:59Z'),
                role: MemberRole.Viewer,
                numberOfInitializedDownloads: 5,
            },
        };

        const result = mapShareResultToSharingInfo(shareResult);

        expect(mockSplitPublicLinkUid).toHaveBeenCalledWith('share-123~link-456');
        expect(result).toEqual({
            shareId: mockShareId,
            publicLinkId: mockPublicLinkId,
            publicLinkUrl: 'https://drive.proton.me/urls/abc123',
            isExpired: false,
            creationTime: new Date('2023-01-01T00:00:00Z').getTime() / 1000,
            expirationTime: new Date('2025-12-31T23:59:59Z').getTime() / 1000,
            numberOfInitializedDownloads: 5,
        });
    });

    it('should handle publicLink without expiration time', () => {
        const mockShareId = 'share-123';
        const mockPublicLinkId = 'link-456';

        mockSplitPublicLinkUid.mockReturnValue({
            shareId: mockShareId,
            publicLinkId: mockPublicLinkId,
        });

        const shareResult: ShareResult = {
            ...mockedBaseShareResult,
            publicLink: {
                uid: 'share-123~link-456',
                url: 'https://drive.proton.me/urls/abc123',
                creationTime: new Date('2023-01-01T00:00:00Z'),
                expirationTime: undefined,
                role: MemberRole.Viewer,
                numberOfInitializedDownloads: 10,
            },
        };

        const result = mapShareResultToSharingInfo(shareResult);

        expect(result).toEqual({
            shareId: mockShareId,
            publicLinkId: mockPublicLinkId,
            publicLinkUrl: 'https://drive.proton.me/urls/abc123',
            isExpired: false,
            creationTime: new Date('2023-01-01T00:00:00Z').getTime() / 1000,
            expirationTime: null,
            numberOfInitializedDownloads: 10,
        });
    });

    it('should detect expired links correctly', () => {
        const mockShareId = 'share-123';
        const mockPublicLinkId = 'link-456';

        mockSplitPublicLinkUid.mockReturnValue({
            shareId: mockShareId,
            publicLinkId: mockPublicLinkId,
        });

        const pastDate = new Date('2024-01-14T12:00:00Z'); // One day before frozen time

        const shareResult: ShareResult = {
            ...mockedBaseShareResult,
            publicLink: {
                uid: 'share-123~link-456',
                url: 'https://drive.proton.me/urls/abc123',
                creationTime: new Date('2023-01-01T00:00:00Z'),
                expirationTime: pastDate,
                role: MemberRole.Viewer,
                numberOfInitializedDownloads: 0,
            },
        };

        const result = mapShareResultToSharingInfo(shareResult);

        expect(result?.isExpired).toBe(true);
    });
});

describe('useSharingInfoStore', () => {
    beforeEach(() => {
        useSharingInfoStore.getState().sharingInfos.clear();
        useSharingInfoStore.getState().loadingUids.clear();
        useSharingInfoStore.getState().emptyOrFailedUids.clear();
    });

    describe('setLoading', () => {
        it('should add uid to loading set and remove from failed set', () => {
            const uid = 'test-uid';

            const store = useSharingInfoStore.getState();
            store.emptyOrFailedUids.add(uid);
            store.setLoading(uid);

            const newState = useSharingInfoStore.getState();
            expect(newState.loadingUids.has(uid)).toBe(true);
            expect(newState.emptyOrFailedUids.has(uid)).toBe(false);
        });
    });

    describe('setSharingInfo', () => {
        it('should set sharing info and remove from loading and failed sets', () => {
            const uid = 'test-uid';
            const sharingInfo = {
                shareId: 'share-123',
                publicLinkId: 'link-456',
                publicLinkUrl: 'https://drive.proton.me/urls/abc123',
                isExpired: false,
                creationTime: 1672531200,
                expirationTime: 1704067199,
                numAccesses: 5,
            };

            const store = useSharingInfoStore.getState();
            store.loadingUids.add(uid);
            store.emptyOrFailedUids.add(uid);
            store.setSharingInfo(uid, sharingInfo);

            const newState = useSharingInfoStore.getState();
            expect(newState.sharingInfos.get(uid)).toEqual(sharingInfo);
            expect(newState.loadingUids.has(uid)).toBe(false);
            expect(newState.emptyOrFailedUids.has(uid)).toBe(false);
        });

        it('should handle undefined sharingInfo by adding to failed set', () => {
            const uid = 'test-uid';

            const store = useSharingInfoStore.getState();
            store.loadingUids.add(uid);
            store.setSharingInfo(uid, undefined);

            const newState = useSharingInfoStore.getState();
            expect(newState.sharingInfos.has(uid)).toBe(false);
            expect(newState.loadingUids.has(uid)).toBe(false);
            expect(newState.emptyOrFailedUids.has(uid)).toBe(true);
        });
    });

    describe('setSharingInfoEmptyOrFailed', () => {
        it('should add uid to failed set and remove from loading set', () => {
            const uid = 'test-uid';

            const store = useSharingInfoStore.getState();
            store.loadingUids.add(uid);
            store.setSharingInfoEmptyOrFailed(uid);

            const newState = useSharingInfoStore.getState();
            expect(newState.emptyOrFailedUids.has(uid)).toBe(true);
            expect(newState.loadingUids.has(uid)).toBe(false);
        });
    });

    describe('getter methods', () => {
        it('should check loading state correctly', () => {
            const { isLoading, loadingUids } = useSharingInfoStore.getState();
            const uid = 'test-uid';

            expect(isLoading(uid)).toBe(false);

            loadingUids.add(uid);
            expect(useSharingInfoStore.getState().isLoading(uid)).toBe(true);
        });

        it('should check empty or failed state correctly', () => {
            const { isEmptyOrFailed, emptyOrFailedUids } = useSharingInfoStore.getState();
            const uid = 'test-uid';

            expect(isEmptyOrFailed(uid)).toBe(false);

            emptyOrFailedUids.add(uid);
            expect(useSharingInfoStore.getState().isEmptyOrFailed(uid)).toBe(true);
        });

        it('should check if has sharing info correctly', () => {
            const { hasSharingInfo, sharingInfos } = useSharingInfoStore.getState();
            const uid = 'test-uid';
            const sharingInfo = {
                shareId: 'share-123',
                publicLinkId: 'link-456',
                publicLinkUrl: 'https://drive.proton.me/urls/abc123',
                isExpired: false,
                creationTime: 1672531200,
                expirationTime: 1704067199,
                numAccesses: 5,
            };

            expect(hasSharingInfo(uid)).toBe(false);

            sharingInfos.set(uid, sharingInfo);
            expect(useSharingInfoStore.getState().hasSharingInfo(uid)).toBe(true);
        });

        it('should get sharing info correctly', () => {
            const { getSharingInfo, sharingInfos } = useSharingInfoStore.getState();
            const uid = 'test-uid';
            const sharingInfo = {
                shareId: 'share-123',
                publicLinkId: 'link-456',
                publicLinkUrl: 'https://drive.proton.me/urls/abc123',
                isExpired: false,
                creationTime: 1672531200,
                expirationTime: 1704067199,
                numAccesses: 5,
            };

            expect(getSharingInfo(uid)).toBeUndefined();

            sharingInfos.set(uid, sharingInfo);
            expect(useSharingInfoStore.getState().getSharingInfo(uid)).toEqual(sharingInfo);
        });
    });
});
