import { act, renderHook, waitFor } from '@testing-library/react';

import { getDrive } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import useFlag from '@proton/unleash/useFlag';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { needPublicRedirectSpotlight, setPublicRedirectSpotlightToPending } from '../../utils/publicRedirectSpotlight';
import { getBookmark } from '../../utils/sdk/getBookmark';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import { usePublicAuthStore } from './usePublicAuth.store';
import { usePublicBookmark } from './usePublicBookmark';
import { getPublicTokenAndPassword } from './utils/getPublicTokenAndPassword';

jest.mock('@proton/drive', () => ({
    getDrive: jest.fn(),
}));

jest.mock('@proton/hooks/useLoading', () => jest.fn(() => [false, jest.fn((fn: () => Promise<void>) => fn())]));

jest.mock('@proton/unleash/useFlag', () => jest.fn());

jest.mock('@proton/shared/lib/apps/helper', () => ({
    getAppHref: jest.fn(),
}));

jest.mock('@proton/shared/lib/helpers/browser', () => ({
    openNewTab: jest.fn(),
}));

jest.mock('../../utils/errorHandling/handleSdkError', () => ({
    handleSdkError: jest.fn(),
}));

jest.mock('../../utils/publicRedirectSpotlight', () => ({
    needPublicRedirectSpotlight: jest.fn(),
    setPublicRedirectSpotlightToPending: jest.fn(),
}));

jest.mock('../../utils/sdk/getBookmark', () => ({
    getBookmark: jest.fn(),
}));

jest.mock('../../utils/telemetry', () => ({
    Actions: {
        AddToBookmark: 'AddToBookmark',
    },
    countActionWithTelemetry: jest.fn(),
}));

jest.mock('./utils/getPublicTokenAndPassword', () => ({
    getPublicTokenAndPassword: jest.fn(),
}));

jest.mock('./usePublicAuth.store', () => ({
    usePublicAuthStore: jest.fn(),
}));

const mockIterateBookmarks = jest.fn();
const mockCreateBookmark = jest.fn();
const mockHandleError = jest.mocked(handleSdkError);
const mockWithLoading = jest.fn((fn: () => Promise<void>) => fn());

describe('usePublicBookmark', () => {
    const mockToken = 'test-token';
    const mockBookmarkUrl = 'https://drive.proton.me/urls/test-token';

    beforeEach(() => {
        jest.clearAllMocks();

        jest.mocked(getDrive).mockReturnValue({
            iterateBookmarks: mockIterateBookmarks,
            createBookmark: mockCreateBookmark,
        } as any);

        jest.mocked(useLoading).mockReturnValue([false, mockWithLoading] as any);

        jest.mocked(useFlag).mockReturnValue(false);

        jest.mocked(getPublicTokenAndPassword).mockReturnValue({
            token: mockToken,
            password: '',
        } as any);

        jest.mocked(needPublicRedirectSpotlight).mockReturnValue(false);

        jest.mocked(getAppHref).mockReturnValue('/shared-with-me');

        Object.defineProperty(window, 'location', {
            value: {
                pathname: `/urls/${mockToken}`,
                href: mockBookmarkUrl,
            },
            writable: true,
        });
    });

    describe('when user is not logged in', () => {
        beforeEach(() => {
            jest.mocked(usePublicAuthStore).mockReturnValue(false);
        });

        it('should not check bookmarks', async () => {
            const { result } = renderHook(() => usePublicBookmark());

            expect(result.current.isBookmarked).toBe(false);
            expect(mockIterateBookmarks).not.toHaveBeenCalled();
        });

        it('should not show spotlight', () => {
            const { result } = renderHook(() => usePublicBookmark());

            expect(result.current.showSaveForLaterSpotlight).toBe(false);
        });
    });

    describe('when feature is disabled', () => {
        beforeEach(() => {
            jest.mocked(usePublicAuthStore).mockReturnValue(true);
            jest.mocked(useFlag).mockReturnValue(true);
        });

        it('should not check bookmarks', () => {
            const { result } = renderHook(() => usePublicBookmark());

            expect(result.current.isBookmarked).toBe(false);
            expect(mockIterateBookmarks).not.toHaveBeenCalled();
        });
    });

    describe('when user is logged in and feature is enabled', () => {
        beforeEach(() => {
            jest.mocked(usePublicAuthStore).mockReturnValue(true);
            jest.mocked(useFlag).mockReturnValue(false);
        });

        it('should check if link is already bookmarked', async () => {
            const mockBookmark = { uid: mockToken };
            mockIterateBookmarks.mockImplementation(async function* () {
                yield mockBookmark;
            });
            jest.mocked(getBookmark).mockReturnValue({
                bookmark: { uid: mockToken },
            } as any);

            const { result } = renderHook(() => usePublicBookmark());

            await waitFor(() => {
                expect(result.current.isBookmarked).toBe(true);
            });

            expect(mockIterateBookmarks).toHaveBeenCalled();
        });

        it('should not mark as bookmarked if token does not match', async () => {
            const mockBookmark = { uid: 'different-token' };
            mockIterateBookmarks.mockImplementation(async function* () {
                yield mockBookmark;
            });
            jest.mocked(getBookmark).mockReturnValue({
                bookmark: { uid: 'different-token' },
            } as any);

            const { result } = renderHook(() => usePublicBookmark());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.isBookmarked).toBe(false);
        });

        it('should handle errors while iterating bookmarks', async () => {
            const error = new Error('API error');
            mockIterateBookmarks.mockImplementation(async function* () {
                throw error;
            });

            const { result } = renderHook(() => usePublicBookmark());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error);
        });

        it('should handle errors while parsing individual bookmarks', async () => {
            const error = new Error('Parse error');
            mockIterateBookmarks.mockImplementation(async function* () {
                yield { uid: mockToken };
            });
            jest.mocked(getBookmark).mockImplementation(() => {
                throw error;
            });

            const { result } = renderHook(() => usePublicBookmark());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, { showNotification: false });
        });

        it('should show spotlight when user is logged in and spotlight is needed', async () => {
            mockIterateBookmarks.mockImplementation(async function* () {
                return;
            });
            jest.mocked(needPublicRedirectSpotlight).mockReturnValue(true);

            const { result } = renderHook(() => usePublicBookmark());

            await waitFor(() => {
                expect(result.current.showSaveForLaterSpotlight).toBe(true);
            });
        });
    });

    describe('addBookmark', () => {
        beforeEach(() => {
            jest.mocked(usePublicAuthStore).mockReturnValue(true);
            jest.mocked(useFlag).mockReturnValue(false);
            mockIterateBookmarks.mockImplementation(async function* () {
                return;
            });
        });

        it('should create bookmark without custom password', async () => {
            mockCreateBookmark.mockResolvedValue(undefined);

            const { result } = renderHook(() => usePublicBookmark());

            await act(async () => {
                await result.current.addBookmark();
            });

            expect(mockCreateBookmark).toHaveBeenCalledWith(mockBookmarkUrl, undefined);
            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.AddToBookmark);
            expect(setPublicRedirectSpotlightToPending).toHaveBeenCalled();
            expect(result.current.isBookmarked).toBe(true);
            expect(result.current.showSaveForLaterSpotlight).toBe(true);
        });

        it('should create bookmark with custom password', async () => {
            const customPassword = 'my-custom-password';
            mockCreateBookmark.mockResolvedValue(undefined);

            const { result } = renderHook(() => usePublicBookmark());

            await act(async () => {
                await result.current.addBookmark(customPassword);
            });

            expect(mockCreateBookmark).toHaveBeenCalledWith(mockBookmarkUrl, customPassword);
            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.AddToBookmark);
            expect(setPublicRedirectSpotlightToPending).toHaveBeenCalled();
            expect(result.current.isBookmarked).toBe(true);
            expect(result.current.showSaveForLaterSpotlight).toBe(true);
        });

        it('should handle errors when adding bookmark', async () => {
            const error = new Error('Failed to create bookmark');
            mockCreateBookmark.mockRejectedValue(error);

            const { result } = renderHook(() => usePublicBookmark());

            await act(async () => {
                await result.current.addBookmark();
            });

            expect(mockHandleError).toHaveBeenCalledWith(error);
            expect(result.current.isBookmarked).toBe(false);
        });
    });

    describe('openInDrive', () => {
        beforeEach(() => {
            jest.mocked(usePublicAuthStore).mockReturnValue(true);
            jest.mocked(useFlag).mockReturnValue(false);
            mockIterateBookmarks.mockImplementation(async function* () {
                return;
            });
        });

        it('should open shared-with-me page in new tab', () => {
            const expectedUrl = '/shared-with-me';
            jest.mocked(getAppHref).mockReturnValue(expectedUrl);

            const { result } = renderHook(() => usePublicBookmark());

            result.current.openInDrive();

            expect(getAppHref).toHaveBeenCalledWith('/shared-with-me', APPS.PROTONDRIVE);
            expect(openNewTab).toHaveBeenCalledWith(expectedUrl);
        });
    });

    describe('cleanup on unmount', () => {
        beforeEach(() => {
            jest.mocked(usePublicAuthStore).mockReturnValue(true);
            jest.mocked(useFlag).mockReturnValue(false);
        });

        it('should abort bookmark iteration when unmounting', async () => {
            const abortController = new AbortController();
            const originalAbort = abortController.abort;
            abortController.abort = jest.fn(originalAbort.bind(abortController));

            mockIterateBookmarks.mockImplementation(async function* (signal) {
                expect(signal).toBeInstanceOf(AbortSignal);
                yield { uid: 'test' };
            });

            const { unmount } = renderHook(() => usePublicBookmark());

            unmount();

            await waitFor(() => {
                expect(mockIterateBookmarks).toHaveBeenCalledWith(expect.any(AbortSignal));
            });
        });
    });
});
