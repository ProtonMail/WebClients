import { act, renderHook, waitFor } from '@testing-library/react';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import useApi from '@proton/components/hooks/useApi';
import useLoading from '@proton/hooks/useLoading';

import usePublicToken from '../../hooks/drive/usePublicToken';
import { usePublicSession } from '../_api';
import { useDriveShareURLBookmarkingFeatureFlag } from '../_bookmarks';
import { useBookmarks } from '../_bookmarks/useBookmarks';
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
const mockedGetSessionInfo = jest.fn().mockReturnValue({ sessionUid: undefined });
jest.mocked(usePublicSession).mockReturnValue({
    getSessionInfo: mockedGetSessionInfo as any,
} as any);

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
    isAuthLoading: false,
    user: 'user' as any,
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
            initialProps: {
                ...defaultProps,
                user: undefined,
            },
        });

        expect(mockedWithLoading).not.toHaveBeenCalled();
        expect(mockedListBookmarks).not.toHaveBeenCalled();
        expect(mockedGetSessionInfo).not.toHaveBeenCalled();

        rerender(defaultProps);
        expect(mockedWithLoading).not.toHaveBeenCalled();
        expect(mockedListBookmarks).not.toHaveBeenCalled();
        expect(mockedGetSessionInfo).toHaveBeenCalled();
        expect(result.current.isLoggedIn).toBe(true);

        mockedGetSessionInfo.mockReturnValueOnce({ sessionUid: UID });
        mockedUseDriveShareURLBookmarkingFeatureFlag.mockReturnValueOnce(false);
        rerender(defaultProps);
        expect(mockedWithLoading).not.toHaveBeenCalled();
        expect(mockedListBookmarks).not.toHaveBeenCalled();
        expect(mockedGetSessionInfo).toHaveBeenCalled();
        expect(result.current.isLoggedIn).toBe(true);
    });

    it('Should set loading to false only if isAuthLoading and user are false', async () => {
        const { rerender } = renderHook((props) => useBookmarksPublicView(props), {
            initialProps: {
                ...defaultProps,
                user: undefined,
                isAuthLoading: true,
            },
        });
        expect(mockedSetIsLoading).toHaveBeenCalledWith(true);

        rerender({ ...defaultProps, user: undefined, isAuthLoading: false });
        expect(mockedSetIsLoading).toHaveBeenCalledWith(false);
    });

    it('Should set bookmarks tokens from listing', async () => {
        mockedGetSessionInfo.mockReturnValueOnce({ sessionUid: UID });
        mockedListBookmarks.mockResolvedValueOnce([
            {
                token: { Token: mockedToken },
            },
        ]);

        const { result } = renderHook(() => useBookmarksPublicView(defaultProps));
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
