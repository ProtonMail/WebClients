import { renderHook } from '@testing-library/react-hooks';

import { useNotifications } from '@proton/components/index';

import { usePublicLinkActions, usePublicLinksListing } from '../_links';
import { useErrorHandler } from '../_utils';
import { usePublicActions } from './usePublicActions';

jest.mock('@proton/components');
const mockCreateNotification = jest.fn();
jest.mocked(useNotifications).mockImplementation(
    () =>
        ({
            createNotification: mockCreateNotification,
        }) as any
);

jest.mock('../_links/useLinksListing/usePublicLinksListing');

jest.mock('../_links/usePublicLinkActions');

const mockNewFolderName = 'New Folder';
const mockCreateFolder = jest.fn().mockResolvedValue(mockNewFolderName);
const mockDeleteChildrenLink = jest.fn();
jest.mocked(usePublicLinkActions).mockImplementation(() => ({
    createFolder: mockCreateFolder,
    deleteChildrenLinks: mockDeleteChildrenLink,
}));

const mockLoadChildren = jest.fn().mockResolvedValue(undefined);
jest.mocked(usePublicLinksListing).mockImplementation(
    () =>
        ({
            loadChildren: mockLoadChildren,
        }) as any
);

jest.mock('../_utils/errorHandler');

const mockError = new Error('Failed to create folder');
const mockShowErrorNotification = jest.fn();

jest.mocked(useErrorHandler).mockImplementation(
    () =>
        ({
            showErrorNotification: mockShowErrorNotification,
        }) as any
);

describe('usePublicActions', () => {
    const mockAbortSignal = new AbortController().signal;
    const mockToken = 'token';
    const mockParentLinkId = 'parentLinkId';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createFolder', () => {
        it('should successfully create a folder and show success notification', async () => {
            const { result } = renderHook(() => usePublicActions());
            const newFolderId = await result.current.createFolder(
                mockAbortSignal,
                mockToken,
                mockParentLinkId,
                mockNewFolderName
            );

            expect(mockCreateFolder).toHaveBeenCalledWith(
                mockAbortSignal,
                mockToken,
                mockParentLinkId,
                mockNewFolderName
            );
            expect(mockLoadChildren).toHaveBeenCalledWith(mockAbortSignal, mockToken, mockParentLinkId, false);
            expect(mockCreateNotification).toHaveBeenCalledWith({
                text: <span className="text-pre-wrap">"New Folder" created successfully</span>,
            });
            expect(newFolderId).toBe(mockNewFolderName);
        });

        it('should handle errors and show error notification', async () => {
            const { result } = renderHook(() => usePublicActions());

            mockCreateFolder.mockRejectedValue(mockError);

            await expect(
                result.current.createFolder(mockAbortSignal, mockToken, mockParentLinkId, mockNewFolderName)
            ).rejects.toThrow(mockError);

            expect(mockCreateFolder).toHaveBeenCalledWith(
                mockAbortSignal,
                mockToken,
                mockParentLinkId,
                mockNewFolderName
            );
            expect(mockShowErrorNotification).toHaveBeenCalledWith(
                mockError,
                <span className="text-pre-wrap">"New Folder" failed to be created</span>
            );
        });
    });
});
