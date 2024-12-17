import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { type DecryptedLink, usePublicSessionUser } from '../../../../store';
import { useAnonymousUploadAuthStore } from '../../../../zustand/upload/anonymous-auth.store';
import { usePublicLinksPermissions } from './usePublicLinksPermissions';

jest.mock('../../../../store', () => ({
    usePublicSessionUser: jest.fn(),
}));

const mockedUsePublicSessionUser = jest.mocked(usePublicSessionUser);

type UsePublicSessionUserParams = ReturnType<typeof usePublicSessionUser>;

const mockUserEmail = 'test@example.com';
const differentEmail = 'other@example.com';
const createMockLink = (options: Partial<DecryptedLink> = {}) =>
    ({
        linkId: '1',
        isFile: true,
        signatureEmail: mockUserEmail,
        activeRevision: {
            signatureEmail: mockUserEmail,
        },
        ...options,
    }) as DecryptedLink;

describe('usePublicLinksPermissions', () => {
    beforeEach(() => {
        mockedUsePublicSessionUser.mockReturnValue({
            userAddressEmail: mockUserEmail,
        } as UsePublicSessionUserParams);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns false for permissions when no user email and no upload tokens', () => {
        mockedUsePublicSessionUser.mockReturnValue({
            userAddressEmail: undefined,
        } as UsePublicSessionUserParams);

        const { result } = renderHook(() => usePublicLinksPermissions(createMockLink()));

        expect(result.current).toEqual({
            canRename: false,
            canDelete: false,
        });
    });

    it('returns false for permissions when no links are provided', () => {
        const { result } = renderHook(() => usePublicLinksPermissions([]));

        expect(result.current).toEqual({
            canRename: false,
            canDelete: false,
        });
    });

    it('allows rename and delete for user who is creator and last editor', () => {
        const link = createMockLink();
        const { result } = renderHook(() => usePublicLinksPermissions(link));

        expect(result.current).toEqual({
            canRename: true,
            canDelete: true,
        });
    });

    it('allows rename but not delete when user is last editor but not creator', () => {
        const link = createMockLink({
            signatureEmail: differentEmail,
        });
        const { result } = renderHook(() => usePublicLinksPermissions(link));

        expect(result.current).toEqual({
            canRename: true,
            canDelete: false,
        });
    });

    it('handles multiple links correctly when user has all permissions', () => {
        const links = [
            createMockLink(),
            createMockLink({
                linkId: '2',
            }),
        ];
        const { result } = renderHook(() => usePublicLinksPermissions(links));

        expect(result.current).toEqual({
            canRename: true,
            canDelete: true,
        });
    });

    it('allows operations for anonymous users with upload tokens', () => {
        mockedUsePublicSessionUser.mockReturnValue({
            userAddressEmail: undefined,
        } as UsePublicSessionUserParams);
        const { result: authStoreResult } = renderHook(() => useAnonymousUploadAuthStore());
        const link = createMockLink();

        act(() => {
            authStoreResult.current.setUploadToken({ linkId: link.linkId, authorizationToken: 'token' });
        });

        const { result } = renderHook(() => usePublicLinksPermissions(link));

        expect(result.current).toEqual({
            canRename: true,
            canDelete: true,
        });
    });

    it('handles non-file links correctly', () => {
        const link = createMockLink({
            isFile: false,
            signatureEmail: mockUserEmail,
        });
        const { result } = renderHook(() => usePublicLinksPermissions(link));

        expect(result.current).toEqual({
            canRename: true,
            canDelete: true,
        });
    });

    it('denies delete permission when any link has different creator', () => {
        const links = [
            createMockLink(),
            createMockLink({
                linkId: '2',
                signatureEmail: differentEmail,
            }),
        ];
        const { result } = renderHook(() => usePublicLinksPermissions(links));

        expect(result.current).toEqual({
            canRename: true,
            canDelete: false,
        });
    });
});
