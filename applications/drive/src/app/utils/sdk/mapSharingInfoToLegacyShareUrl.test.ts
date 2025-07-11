import { MemberRole, type ShareResult } from '@proton/drive';

import { mapShareResultToLegacyShareUrl } from './mapSharingInfoToLegacyShareUrl';

const shareId = 'CIriuFjLUPGaDRpybzLKvantGzk6LSlW8NOdD7AuiKEuhDyqhu9aRRUKfOFbcuTwU0z6ZdKXf6H36YuHJChCfA==';
const publicLinkId = '19AK36motsvzPm8YC1xXV7byLkY9TkusYWC9l1Gnlg1T_S2m5UrhqoQ2YrTCHSeiL8aIHY0D5jYUcTElRoGJVQ';

const nodeUid = `${shareId}~${publicLinkId}`;
describe('mapSharingInfoToLegacyShareUrl', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const mockCreationTime = new Date('2023-01-01T12:00:00.000Z');
    const mockExpirationTime = new Date('2030-12-31T23:59:59.999Z');
    const futureExpirationTime = new Date('2030-01-01T00:00:00.000Z');
    const pastExpirationTime = new Date('2020-01-01T00:00:00.000Z');

    const mockPublicLink = {
        uid: nodeUid,
        creationTime: mockCreationTime,
        role: MemberRole.Viewer,
        url: 'https://example.com/share/token123',
        customPassword: undefined,
        expirationTime: mockExpirationTime,
    };
    const mockShareResult = {
        members: [],
        protonInvitations: [],
        nonProtonInvitations: [],
        publicLink: mockPublicLink,
    };

    it('should map ShareResult with expiration time correctly', () => {
        const shareResult: ShareResult = mockShareResult;

        const result = mapShareResultToLegacyShareUrl(shareResult);

        expect(result).toEqual({
            id: publicLinkId,
            createTime: Math.floor(mockCreationTime.getTime() / 1000),
            token: '',
            isExpired: false,
            expireTime: Math.floor(mockExpirationTime.getTime() / 1000),
        });
    });

    it('should map ShareResult without expiration time', () => {
        const publicLinkWithoutExpiration = {
            ...mockPublicLink,
            expirationTime: undefined,
        };

        const shareResult: ShareResult = {
            ...mockShareResult,
            publicLink: publicLinkWithoutExpiration,
        };

        const result = mapShareResultToLegacyShareUrl(shareResult);

        expect(result).toEqual({
            id: publicLinkId,
            createTime: Math.floor(mockCreationTime.getTime() / 1000),
            token: '',
            isExpired: false,
            expireTime: null,
        });
    });

    it('should correctly identify expired links', () => {
        const expiredPublicLink = {
            ...mockPublicLink,
            expirationTime: pastExpirationTime,
        };

        const shareResult: ShareResult = {
            ...mockShareResult,
            publicLink: expiredPublicLink,
        };

        const result = mapShareResultToLegacyShareUrl(shareResult);

        expect(result).toEqual({
            id: publicLinkId,
            createTime: Math.floor(mockCreationTime.getTime() / 1000),
            token: '',
            isExpired: true,
            expireTime: Math.floor(pastExpirationTime.getTime() / 1000),
        });
    });

    it('should correctly identify non-expired links', () => {
        const futurePublicLink = {
            ...mockPublicLink,
            expirationTime: futureExpirationTime,
        };

        const shareResult: ShareResult = {
            ...mockShareResult,
            publicLink: futurePublicLink,
        };

        const result = mapShareResultToLegacyShareUrl(shareResult);

        expect(result).toEqual({
            id: publicLinkId,
            createTime: Math.floor(mockCreationTime.getTime() / 1000),
            token: '',
            isExpired: false,
            expireTime: Math.floor(futureExpirationTime.getTime() / 1000),
        });
    });

    it('should return undefined when ShareResult has no publicLink', () => {
        const shareResult: ShareResult = {
            ...mockShareResult,
            publicLink: undefined,
        };

        const result = mapShareResultToLegacyShareUrl(shareResult);

        expect(result).toBeUndefined();
    });
});
