import { renderHook } from '@testing-library/react';

import { useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive/index';

import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import { sendErrorReport } from '../../../utils/errorHandling';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { useBookmarksActions } from './useBookmarksActions';

jest.mock('@proton/components', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('@proton/drive/index', () => ({
    useDrive: jest.fn(),
}));

jest.mock('../../../utils/ActionEventManager/ActionEventManager', () => ({
    getActionEventManager: jest.fn(),
}));

jest.mock('../../../utils/errorHandling', () => ({
    sendErrorReport: jest.fn(),
}));

jest.mock('../../../utils/telemetry', () => ({
    Actions: {
        OpenPublicLinkFromSharedWithMe: 'OpenPublicLinkFromSharedWithMe',
        DeleteBookmarkFromSharedWithMe: 'DeleteBookmarkFromSharedWithMe',
    },
    countActionWithTelemetry: jest.fn(),
}));

const mockCreateNotification = jest.fn();
const mockRemoveBookmark = jest.fn();
const mockEventManagerEmit = jest.fn();
const mockEventManager = {
    emit: mockEventManagerEmit,
};

describe('useBookmarksActions', () => {
    beforeEach(() => {
        jest.mocked(useNotifications).mockReturnValue({
            createNotification: mockCreateNotification,
        } as any);

        jest.mocked(useDrive).mockReturnValue({
            drive: {
                removeBookmark: mockRemoveBookmark,
            },
        } as any);

        jest.mocked(getActionEventManager).mockReturnValue(mockEventManager as any);

        Object.defineProperty(window, 'location', {
            value: {
                assign: jest.fn(),
            },
            writable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('openBookmark', () => {
        it('should open bookmark URL with partial public view parameter', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const testUrl = 'https://example.com/bookmark';

            await result.current.openBookmark(testUrl);

            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.OpenPublicLinkFromSharedWithMe);
            expect(window.location.assign).toHaveBeenCalledWith('https://example.com/bookmark?partialPublicView=true');
        });
    });

    describe('deleteBookmark', () => {
        it('should show confirmation modal and delete single bookmark on confirm', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const mockShowConfirmModal = jest.fn();
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

            const { onSubmit } = mockShowConfirmModal.mock.lastCall[0];
            await onSubmit();

            expect(mockRemoveBookmark).toHaveBeenCalledWith(uid);
            expect(mockEventManagerEmit).toHaveBeenCalledWith({
                type: ActionEventName.DELETE_BOOKMARKS,
                uids: [uid],
            });
            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.DeleteBookmarkFromSharedWithMe, 1);
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'success',
                text: 'Selected items were successfully removed from your list',
            });
        });
    });

    describe('deleteBookmarks', () => {
        it('should show confirmation modal and delete multiple bookmarks on confirm', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const mockShowConfirmModal = jest.fn();
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

            const { onSubmit } = mockShowConfirmModal.mock.lastCall[0];
            await onSubmit();

            expect(mockRemoveBookmark).toHaveBeenCalledTimes(2);
            expect(mockRemoveBookmark).toHaveBeenCalledWith(uids[0]);
            expect(mockRemoveBookmark).toHaveBeenCalledWith(uids[1]);
            expect(mockEventManagerEmit).toHaveBeenCalledWith({
                type: ActionEventName.DELETE_BOOKMARKS,
                uids: uids,
            });
            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.DeleteBookmarkFromSharedWithMe, 2);
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'success',
                text: 'Selected items were successfully removed from your list',
            });
        });

        it('should handle partial failures when deleting bookmarks', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const mockShowConfirmModal = jest.fn();
            const uids = ['bookmark-uid-1', 'bookmark-uid-2', 'bookmark-uid-3'];

            mockRemoveBookmark
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('API Error'))
                .mockResolvedValueOnce(undefined);

            await result.current.deleteBookmarks(mockShowConfirmModal, uids);

            const { onSubmit } = mockShowConfirmModal.mock.lastCall[0];
            await onSubmit();

            expect(mockEventManagerEmit).toHaveBeenCalledWith({
                type: ActionEventName.DELETE_BOOKMARKS,
                uids: ['bookmark-uid-1', 'bookmark-uid-3'],
            });
            expect(countActionWithTelemetry).toHaveBeenCalledWith(Actions.DeleteBookmarkFromSharedWithMe, 2);
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'Selected items failed to be removed from your list',
            });
            expect(sendErrorReport).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle complete failure when deleting bookmarks', async () => {
            const { result } = renderHook(() => useBookmarksActions());
            const mockShowConfirmModal = jest.fn();
            const uids = ['bookmark-uid-1'];
            const error = new Error('API Error');

            mockRemoveBookmark.mockRejectedValue(error);

            await result.current.deleteBookmarks(mockShowConfirmModal, uids);

            const { onSubmit } = mockShowConfirmModal.mock.lastCall[0];
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
