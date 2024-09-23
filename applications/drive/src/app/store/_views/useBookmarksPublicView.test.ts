import { act, renderHook, waitFor } from '@testing-library/react';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import useApi from '@proton/components/hooks/useApi';
import useLoading from '@proton/hooks/useLoading';

import usePublicToken from '../../hooks/drive/usePublicToken';
import { useDriveShareURLBookmarkingFeatureFlag } from '../_bookmarks';
import { useBookmarks } from '../_bookmarks/useBookmarks';
import { usePublicSessionUser } from '../_user';
import { useBookmarksPublicView } from './useBookmarksPublicView';

jest.mock('../_bookmarks');
const mockedUseDriveShareURLBookmarkingFeatureFlag = jest
    .mocked(useDriveShareURLBookmarkingFeatureFlag)
    .mockReturnValue(true);

jest.mock('@proton/hooks/useLoading');
const mockedWithLoading = jest.fn().mockImplementation((fn) => fn());
const mockedSetIsLoading = jest.fn();
jest.mocked(useLoading).mockReturnValue([true, mockedWithLoading, mockedSetIsLoading]);

jest.mock('../_api');

jest.mock('@proton/components/hooks/useApi');
jest.mocked(useApi).mockReturnValue({ UID: undefined } as any);

jest.mock('../_bookmarks/useBookmarks');
const mockedListBookmarks = jest.fn().mockResolvedValue([]);
const mockedAddBookmarks = jest.fn().mockResolvedValue({});
jest.mocked(useBookmarks).mockReturnValue({
    listBookmarks: mockedListBookmarks as any,
    addBookmark: mockedAddBookmarks as any,
    deleteBookmark: jest.fn().mockResolvedValue({}) as any,
});

jest.mock('../_user');
const mockedUsePublicSessionUser = jest.mocked(usePublicSessionUser).mockReturnValue({
    user: undefined,
    localID: undefined,
    UID: '',
});

const mockedToken = 'token';
const mockedUrlPassword = '#password';
jest.mock('../../hooks/drive/usePublicToken');
jest.mocked(usePublicToken).mockReturnValue({ urlPassword: mockedUrlPassword, token: mockedToken });

jest.mock('@proton/shared/lib/authentication/persistedSessionHelper', () => {
    return {
        ...jest.requireActual('@proton/shared/lib/authentication/persistedSessionHelper'),
        resumeSession: jest.fn().mockReturnValue({}),
    };
});

const defaultProps = {
    customPassword: undefined,
};
const UID = 'UID';

describe('useBookmarksPublicView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        verifyAllWhenMocksCalled();
    });
    it('Should not list bookmarks if user or UID is undefined or if FF disabled', () => {
        const { rerender, result } = renderHook((props) => useBookmarksPublicView(props), {
            initialProps: defaultProps,
        });

        expect(mockedWithLoading).not.toHaveBeenCalled();
        expect(mockedListBookmarks).not.toHaveBeenCalled();
        expect(result.current.isAlreadyBookmarked).toBe(false);

        rerender(defaultProps);
        expect(mockedWithLoading).not.toHaveBeenCalled();
        expect(mockedListBookmarks).not.toHaveBeenCalled();
        expect(result.current.isAlreadyBookmarked).toBe(false);

        mockedUsePublicSessionUser.mockReturnValueOnce({ user: 'user', UID } as any);
        mockedUseDriveShareURLBookmarkingFeatureFlag.mockReturnValueOnce(false);
        rerender(defaultProps);
        expect(mockedWithLoading).not.toHaveBeenCalled();
        expect(mockedListBookmarks).not.toHaveBeenCalled();
        expect(result.current.isAlreadyBookmarked).toBe(false);
    });

    it('Should set bookmarks tokens from listing', async () => {
        mockedUsePublicSessionUser.mockReturnValueOnce({ user: 'user', UID } as any);
        mockedListBookmarks.mockResolvedValueOnce([
            {
                token: { Token: mockedToken },
            },
        ]);

        const { result } = renderHook(() => useBookmarksPublicView(defaultProps));
        await waitFor(() => expect(mockedListBookmarks).toHaveBeenCalled());
        await waitFor(() => expect(result.current.isAlreadyBookmarked).toBe(true));
        expect(mockedWithLoading).toHaveBeenCalled();
    });

    it('Should be able to add bookmark', async () => {
        const { result } = renderHook(() => useBookmarksPublicView(defaultProps));
        when(mockedAddBookmarks).calledWith({ token: mockedToken, password: mockedUrlPassword });

        expect(result.current.isAlreadyBookmarked).toBe(false);
        act(() => {
            void result.current.addBookmark();
        });
        await waitFor(() => expect(result.current.isAlreadyBookmarked).toBe(true));
    });
});
