import { renderHook } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import { sendErrorReport } from '@proton/drive/legacy/errorHandling';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { getDrive, useDrive } from '@proton/drive/sdk';
import { assignUrl } from '@proton/shared/lib/helpers/location';
import { setLocation } from '@proton/vitest-config/setLocation';

import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { useBookmarksActions } from './useBookmarksActions';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn(),
}));

vi.mock('@proton/drive/sdk', () => ({
    useDrive: vi.fn(),
    getDrive: vi.fn(),
}));

const mockDriveClient = { type: 'drive' } as any;

vi.mock('@proton/drive/modules/busDriver', async () => ({
    ...(await vi.importActual('@proton/drive/modules/busDriver')),
    getBusDriver: vi.fn(),
}));

vi.mock('@proton/drive/legacy/errorHandling', () => ({
    sendErrorReport: vi.fn(),
}));

vi.mock('../../../utils/telemetry', () => ({
    Actions: {
        OpenPublicLinkFromSharedWithMe: 'OpenPublicLinkFromSharedWithMe',
        DeleteBookmarkFromSharedWithMe: 'DeleteBookmarkFromSharedWithMe',
    },
    countActionWithTelemetry: vi.fn(),
}));

vi.mock('@proton/shared/lib/helpers/location');

vi.mock('../../../utils/replaceLocalURL', () => ({
    replaceLocalURL: vi.fn((url) => url),
}));

const mockCreateNotification = vi.fn();
const mockRemoveBookmark = vi.fn();
const mockEventManagerEmit = vi.fn();
const mockEventManager = {
    emit: mockEventManagerEmit,
};

describe('useBookmarksActions', () => {
    beforeEach(() => {
        vi.mocked(useNotifications).mockReturnValue({
            createNotification: mockCreateNotification,
        } as any);

        vi.mocked(useDrive).mockReturnValue({
            drive: {
                removeBookmark: mockRemoveBookmark,
            },
        } as any);

        vi.mocked(getDrive).mockReturnValue(mockDriveClient);
        vi.mocked(getBusDriver).mockReturnValue(mockEventManager as any);

        setLocation('https://proton.dev');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('openBookmark', () => {
        it('should open bookmark URL with partial public view parameter', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const testUrl = 'https://proton.dev/bookmark';

            await result.current.openBookmark(testUrl);

            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.OpenPublicLinkFromSharedWithMe);
            expect(assignUrl).toHaveBeenCalledWith('https://proton.dev/bookmark?partialPublicView=true');
        });
    });

    describe('deleteBookmark', () => {
        it('should show confirmation modal and delete single bookmark on confirm', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const mockShowConfirmModal = vi.fn();
            const uid = 'bookmark-uid-1';

            mockRemoveBookmark.mockResolvedValue(undefined);

            await result.current.deleteBookmark(mockShowConfirmModal, uid);

            expect(mockShowConfirmModal).toHaveBeenCalledWith({
                title: 'Are you sure you want to remove this item from your list?',
                message: 'You will need to save it again from the public link page.',
                submitText: 'Confirm',
                onSubmit: expect.any(Function),
                canUndo: true,
            });

            const { onSubmit } = mockShowConfirmModal.mock.lastCall![0];
            await onSubmit();

            expect(mockRemoveBookmark).toHaveBeenCalledWith(uid);
            expect(mockEventManagerEmit).toHaveBeenCalledWith(
                {
                    type: BusDriverEventName.DELETE_BOOKMARKS,
                    uids: [uid],
                },
                mockDriveClient
            );
            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.DeleteBookmarkFromSharedWithMe, 1);
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'success',
                text: 'Selected item was successfully removed from your list',
            });
        });
    });

    describe('deleteBookmarks', () => {
        it('should show confirmation modal and delete multiple bookmarks on confirm', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const mockShowConfirmModal = vi.fn();
            const uids = ['bookmark-uid-1', 'bookmark-uid-2'];

            mockRemoveBookmark.mockResolvedValue(undefined);

            await result.current.deleteBookmarks(mockShowConfirmModal, uids);

            expect(mockShowConfirmModal).toHaveBeenCalledWith({
                title: 'Are you sure you want to remove those items from your list?',
                message: 'You will need to save them again from the public link page.',
                submitText: 'Confirm',
                onSubmit: expect.any(Function),
                canUndo: true,
            });

            const { onSubmit } = mockShowConfirmModal.mock.lastCall![0];
            await onSubmit();

            expect(mockRemoveBookmark).toHaveBeenCalledTimes(2);
            expect(mockRemoveBookmark).toHaveBeenCalledWith(uids[0]);
            expect(mockRemoveBookmark).toHaveBeenCalledWith(uids[1]);
            expect(mockEventManagerEmit).toHaveBeenCalledWith(
                {
                    type: BusDriverEventName.DELETE_BOOKMARKS,
                    uids: uids,
                },
                mockDriveClient
            );
            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.DeleteBookmarkFromSharedWithMe, 2);
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'success',
                text: 'Selected items were successfully removed from your list',
            });
        });

        it('should handle partial failures when deleting bookmarks', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const mockShowConfirmModal = vi.fn();
            const uids = ['bookmark-uid-1', 'bookmark-uid-2', 'bookmark-uid-3'];

            mockRemoveBookmark
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('API Error'))
                .mockResolvedValueOnce(undefined);

            await result.current.deleteBookmarks(mockShowConfirmModal, uids);

            const { onSubmit } = mockShowConfirmModal.mock.lastCall![0];
            await onSubmit();

            expect(mockEventManagerEmit).toHaveBeenCalledWith(
                {
                    type: BusDriverEventName.DELETE_BOOKMARKS,
                    uids: ['bookmark-uid-1', 'bookmark-uid-3'],
                },
                mockDriveClient
            );
            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.DeleteBookmarkFromSharedWithMe, 2);
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'Selected items failed to be removed from your list',
            });
            expect(sendErrorReport).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle complete failure when deleting bookmarks', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const mockShowConfirmModal = vi.fn();
            const uids = ['bookmark-uid-1'];
            const error = new Error('API Error');

            mockRemoveBookmark.mockRejectedValue(error);

            await result.current.deleteBookmarks(mockShowConfirmModal, uids);

            const { onSubmit } = mockShowConfirmModal.mock.lastCall![0];
            await onSubmit();

            expect(mockEventManagerEmit).not.toHaveBeenCalled();
            expect(countActionWithTelemetry).not.toHaveBeenCalled();
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'Selected item was not removed from your list',
            });
            expect(sendErrorReport).toHaveBeenCalledWith(error);
        });
    });
});
