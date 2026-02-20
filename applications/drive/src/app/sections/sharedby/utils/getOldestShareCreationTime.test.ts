import { MemberRole, type ShareResult } from '@proton/drive';

import { getOldestShareCreationTime } from './getOldestShareCreationTime';

const createMockShareResult = (overrides: Partial<ShareResult> = {}): ShareResult => ({
    publicLink: undefined,
    protonInvitations: [],
    nonProtonInvitations: [],
    members: [],
    editorsCanShare: false,
    ...overrides,
});

describe('getOldestShareCreationTime', () => {
    it('should return undefined when no sharing exists', () => {
        const shareResult = createMockShareResult();

        const result = getOldestShareCreationTime(shareResult);

        expect(result).toBeUndefined();
    });

    it('should return publicLink creation time when only public link exists', () => {
        const creationTime = new Date('2023-01-15T10:00:00Z');
        const shareResult = createMockShareResult({
            publicLink: {
                uid: 'public-link-uid',
                creationTime,
                expirationTime: undefined,
                numberOfInitializedDownloads: 0,
                url: 'https://example.com/share',
                role: MemberRole.Viewer,
            },
        });

        const result = getOldestShareCreationTime(shareResult);

        expect(result).toEqual(creationTime);
    });

    it('should return oldest invitation time from proton invitations', () => {
        const olderTime = new Date('2023-01-10T10:00:00Z');
        const newerTime = new Date('2023-01-20T10:00:00Z');
        const shareResult = createMockShareResult({
            protonInvitations: [{ invitationTime: newerTime } as any, { invitationTime: olderTime } as any],
        });

        const result = getOldestShareCreationTime(shareResult);

        expect(result).toEqual(olderTime);
    });

    it('should return oldest time across all sharing types', () => {
        const publicLinkTime = new Date('2023-01-15T10:00:00Z');
        const protonInvitationTime = new Date('2023-01-10T10:00:00Z');
        const nonProtonInvitationTime = new Date('2023-01-05T10:00:00Z');
        const memberTime = new Date('2023-01-20T10:00:00Z');

        const shareResult = createMockShareResult({
            publicLink: {
                uid: 'public-link-uid',
                creationTime: publicLinkTime,
                expirationTime: undefined,
                numberOfInitializedDownloads: 0,
                url: 'https://example.com/share',
                role: MemberRole.Viewer,
            },
            protonInvitations: [{ invitationTime: protonInvitationTime } as any],
            nonProtonInvitations: [{ invitationTime: nonProtonInvitationTime } as any],
            members: [{ invitationTime: memberTime } as any],
        });

        const result = getOldestShareCreationTime(shareResult);

        expect(result).toEqual(nonProtonInvitationTime);
    });

    it('should handle same timestamps', () => {
        const sameTime = new Date('2023-01-15T10:00:00Z');
        const shareResult = createMockShareResult({
            publicLink: {
                uid: 'public-link-uid',
                creationTime: sameTime,
                expirationTime: undefined,
                numberOfInitializedDownloads: 0,
                url: 'https://example.com/share',
                role: MemberRole.Viewer,
            },
            protonInvitations: [{ invitationTime: sameTime } as any],
        });

        const result = getOldestShareCreationTime(shareResult);

        expect(result).toEqual(sameTime);
    });
});
