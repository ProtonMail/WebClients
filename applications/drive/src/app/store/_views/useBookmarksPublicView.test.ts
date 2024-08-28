import { act, renderHook, waitFor } from '@testing-library/react';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import useApi from '@proton/components/hooks/useApi';
import useLoading from '@proton/hooks/useLoading';

import usePublicToken from '../../hooks/drive/usePublicToken';
import { usePublicSession } from '../_api';
import { useDriveShareURLBookmarkingFeatureFlag } from '../_bookmarks';
import { useBookmarks } from '../_bookmarks/useBookmarks';
import { usePublicShare } from '../_shares';
import { useBookmarksPublicView } from './useBookmarksPublicView';

jest.mock('../_bookmarks');
const mockedUseDriveShareURLBookmarkingFeatureFlag = jest
    .mocked(useDriveShareURLBookmarkingFeatureFlag)
    .mockReturnValue(true);

jest.mock('@proton/hooks/useLoading');
const mockedWithLoading = jest.fn().mockImplementation((fn) => fn());
jest.mocked(useLoading).mockReturnValue([true, mockedWithLoading, () => {}]);

jest.mock('../_shares');
const mockedUsePublicShare = jest.mocked(usePublicShare).mockReturnValue({ user: undefined } as any);

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

const UID = 'UID';

describe('useBookmarksPublicView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        verifyAllWhenMocksCalled();
    });
    it('Should not list bookmarks if user or UID is undefined or if FF disabled', () => {
        const { rerender, result } = renderHook(() => useBookmarksPublicView());

        expect(mockedWithLoading).not.toHaveBeenCalled();
        expect(mockedListBookmarks).not.toHaveBeenCalled();
        expect(mockedGetSessionInfo).not.toHaveBeenCalled();

        mockedUsePublicShare.mockReturnValueOnce({ user: 'user' } as any);
        rerender();
        expect(mockedWithLoading).not.toHaveBeenCalled();
        expect(mockedListBookmarks).not.toHaveBeenCalled();
        expect(mockedGetSessionInfo).toHaveBeenCalled();
        expect(result.current.isLoggedIn).toBe(true);

        mockedUsePublicShare.mockReturnValueOnce({ user: 'user' } as any);
        mockedGetSessionInfo.mockReturnValueOnce({ sessionUid: UID });
        mockedUseDriveShareURLBookmarkingFeatureFlag.mockReturnValueOnce(false);
        rerender();
        expect(mockedWithLoading).not.toHaveBeenCalled();
        expect(mockedListBookmarks).not.toHaveBeenCalled();
        expect(mockedGetSessionInfo).toHaveBeenCalled();
        expect(result.current.isLoggedIn).toBe(true);
    });

    it('Should set bookmarks tokens from listing', async () => {
        mockedUsePublicShare.mockReturnValueOnce({ user: 'user' } as any);
        mockedGetSessionInfo.mockReturnValueOnce({ sessionUid: UID });
        mockedListBookmarks.mockResolvedValueOnce([
            {
                token: { Token: mockedToken },
            },
        ]);

        const { result } = renderHook(() => useBookmarksPublicView());
        await waitFor(() => expect(result.current.isAlreadyBookmarked).toBe(true));
        expect(mockedWithLoading).toHaveBeenCalled();
    });

    it('Should be able to add bookmark', async () => {
        const { result } = renderHook(() => useBookmarksPublicView());
        when(mockedAddBookmarks).calledWith({ token: mockedToken, password: mockedUrlPassword });

        expect(result.current.isAlreadyBookmarked).toBe(false);
        act(() => {
            void result.current.addBookmark();
        });
        await waitFor(() => expect(result.current.isAlreadyBookmarked).toBe(true));
    });
});
