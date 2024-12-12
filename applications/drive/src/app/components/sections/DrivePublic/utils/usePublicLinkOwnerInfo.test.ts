import { renderHook } from '@testing-library/react-hooks';

import { type DecryptedLink, usePublicSessionUser } from '../../../../store';
import { usePublicLinkOwnerInfo } from './usePublicLinkOwnerInfo';

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
        signatureAddress: mockUserEmail,
        activeRevision: {
            signatureAddress: mockUserEmail,
        },
        ...options,
    }) as DecryptedLink;

describe('usePublicLinkOwnerInfo', () => {
    beforeEach(() => {
        mockedUsePublicSessionUser.mockReturnValue({
            userAddressEmail: mockUserEmail,
        } as UsePublicSessionUserParams);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns false for both when no user email is available', () => {
        mockedUsePublicSessionUser.mockReturnValue({
            userAddressEmail: undefined,
        } as UsePublicSessionUserParams);

        const { result } = renderHook(() => usePublicLinkOwnerInfo(createMockLink()));

        expect(result.current).toEqual({
            isCreator: false,
            isLastEditor: false,
            loggedIn: false,
        });
    });

    it('returns false for both when no links are provided', () => {
        const { result } = renderHook(() => usePublicLinkOwnerInfo([]));

        expect(result.current).toEqual({
            isCreator: false,
            isLastEditor: false,
            loggedIn: false,
        });
    });

    it('identifies user as creator and last editor for a single matching link', () => {
        const link = createMockLink();
        const { result } = renderHook(() => usePublicLinkOwnerInfo(link));

        expect(result.current).toEqual({
            isCreator: true,
            isLastEditor: true,
            loggedIn: true,
        });
    });

    it('identifies user as creator but not last editor when signatures email differ', () => {
        const link = createMockLink({
            activeRevision: {
                signatureAddress: differentEmail,
            },
        } as DecryptedLink);
        const { result } = renderHook(() => usePublicLinkOwnerInfo(link));

        expect(result.current).toEqual({
            isCreator: true,
            isLastEditor: false,
            loggedIn: true,
        });
    });

    it('handles multiple links correctly', () => {
        const links = [
            createMockLink(),
            createMockLink({
                linkId: '2',
            }),
        ];
        const { result } = renderHook(() => usePublicLinkOwnerInfo(links));

        expect(result.current).toEqual({
            isCreator: true,
            isLastEditor: true,
            loggedIn: true,
        });
    });

    it('returns false for both when any link in the array has different creator', () => {
        const links = [
            createMockLink(),
            createMockLink({
                linkId: '2',
                signatureAddress: differentEmail,
            }),
        ];
        const { result } = renderHook(() => usePublicLinkOwnerInfo(links));

        expect(result.current).toEqual({
            isCreator: false,
            isLastEditor: true,
            loggedIn: true,
        });
    });

    it('handles non-file links correctly', () => {
        const link = createMockLink({
            isFile: false,
            signatureAddress: mockUserEmail,
        });
        const { result } = renderHook(() => usePublicLinkOwnerInfo([link]));

        expect(result.current).toEqual({
            isCreator: true,
            isLastEditor: true,
            loggedIn: true,
        });
    });

    it('returns false for last editor when any link has different last editor', () => {
        const links = [
            createMockLink(),
            createMockLink({
                linkId: '2',
                activeRevision: {
                    signatureAddress: differentEmail,
                },
            } as DecryptedLink),
        ];
        const { result } = renderHook(() => usePublicLinkOwnerInfo(links));

        expect(result.current).toEqual({
            isCreator: true,
            isLastEditor: false,
            loggedIn: true,
        });
    });
});
