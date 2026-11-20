import { act, renderHook, waitFor } from '@testing-library/react';

import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getDrive } from '@proton/drive/sdk';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';
import { setLocation } from '@proton/vitest-config/setLocation';

import { needPublicRedirectSpotlight, setPublicRedirectSpotlightToPending } from '../../utils/publicRedirectSpotlight';
import { getBookmark } from '../../utils/sdk/getBookmark';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import { usePublicAuthStore } from './usePublicAuth.store';
import { usePublicBookmark } from './usePublicBookmark';
import { getPublicTokenAndPassword } from './utils/getPublicTokenAndPassword';

vi.mock('@proton/drive/sdk', () => ({
    getDrive: vi.fn(),
}));

vi.mock('@proton/hooks/useLoading', () => ({
    default: vi.fn(() => [false, vi.fn((fn: () => Promise<void>) => fn())]),
}));

vi.mock('@proton/shared/lib/apps/helper', () => ({
    getAppHref: vi.fn(),
}));

vi.mock('@proton/shared/lib/helpers/browser', () => ({
    openNewTab: vi.fn(),
}));

vi.mock('@proton/drive/legacy/errorHandling', () => ({
    handleSdkError: vi.fn(),
}));

vi.mock('../../utils/publicRedirectSpotlight', () => ({
    needPublicRedirectSpotlight: vi.fn(),
    setPublicRedirectSpotlightToPending: vi.fn(),
}));

vi.mock('../../utils/sdk/getBookmark', () => ({
    getBookmark: vi.fn(),
}));

vi.mock('../../utils/telemetry', () => ({
    Actions: {
        AddToBookmark: 'AddToBookmark',
    },
    countActionWithTelemetry: vi.fn(),
}));

vi.mock('./utils/getPublicTokenAndPassword', () => ({
    getPublicTokenAndPassword: vi.fn(),
}));

vi.mock('./usePublicAuth.store', () => ({
    usePublicAuthStore: vi.fn(),
}));

const mockIterateBookmarks = vi.fn();
const mockCreateBookmark = vi.fn();
const mockHandleError = vi.mocked(handleSdkError);
const mockWithLoading = vi.fn((fn: () => Promise<void>) => fn());

describe('usePublicBookmark', () => {
    const mockToken = 'test-token';
    const mockBookmarkUrl = 'https://drive.proton.me/urls/test-token';

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(getDrive).mockReturnValue({
            iterateBookmarks: mockIterateBookmarks,
            createBookmark: mockCreateBookmark,
        } as any);

        vi.mocked(useLoading).mockReturnValue([false, mockWithLoading] as any);

        vi.mocked(getPublicTokenAndPassword).mockReturnValue({
            token: mockToken,
            password: '',
        } as any);

        vi.mocked(needPublicRedirectSpotlight).mockReturnValue(false);

        vi.mocked(getAppHref).mockReturnValue('/shared-with-me');

        setLocation(mockBookmarkUrl);
    });

    describe('when user is not logged in', () => {
        beforeEach(() => {
            vi.mocked(usePublicAuthStore).mockReturnValue(false);
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

    describe('when user is logged in', () => {
        beforeEach(() => {
            vi.mocked(usePublicAuthStore).mockReturnValue(true);
        });

        it('should check if link is already bookmarked', async () => {
            const mockBookmark = { uid: mockToken };
            mockIterateBookmarks.mockImplementation(async function* () {
                yield mockBookmark;
            });
            vi.mocked(getBookmark).mockReturnValue({
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
            vi.mocked(getBookmark).mockReturnValue({
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
            vi.mocked(getBookmark).mockImplementation(() => {
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
            vi.mocked(needPublicRedirectSpotlight).mockReturnValue(true);

            const { result } = renderHook(() => usePublicBookmark());

            await waitFor(() => {
                expect(result.current.showSaveForLaterSpotlight).toBe(true);
            });
        });
    });

    describe('addBookmark', () => {
        beforeEach(() => {
            vi.mocked(usePublicAuthStore).mockReturnValue(true);
            vi.mocked(useFlag).mockReturnValue(false);
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
            vi.mocked(usePublicAuthStore).mockReturnValue(true);
            vi.mocked(useFlag).mockReturnValue(false);
            mockIterateBookmarks.mockImplementation(async function* () {
                return;
            });
        });

        it('should open shared-with-me page in new tab', () => {
            const expectedUrl = '/shared-with-me';
            vi.mocked(getAppHref).mockReturnValue(expectedUrl);

            const { result } = renderHook(() => usePublicBookmark());

            result.current.openInDrive();

            expect(getAppHref).toHaveBeenCalledWith('/shared-with-me', APPS.PROTONDRIVE);
            expect(openNewTab).toHaveBeenCalledWith(expectedUrl);
        });
    });

    describe('cleanup on unmount', () => {
        beforeEach(() => {
            vi.mocked(usePublicAuthStore).mockReturnValue(true);
            vi.mocked(useFlag).mockReturnValue(false);
        });

        it('should abort bookmark iteration when unmounting', async () => {
            const abortController = new AbortController();
            const originalAbort = abortController.abort;
            abortController.abort = vi.fn(originalAbort.bind(abortController));

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
