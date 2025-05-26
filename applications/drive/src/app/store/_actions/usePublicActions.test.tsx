import { renderHook } from '@testing-library/react-hooks';

import { useNotifications } from '@proton/components';

import { usePublicLinkActions, usePublicLinksActions, usePublicLinksListing } from '../_links';
import useLinksState from '../_links/useLinksState';
import { usePublicSessionUser } from '../_user';
import { useErrorHandler } from '../_utils';
import useListNotifications from './useListNotifications';
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

jest.mock('../_user', () => ({
    usePublicSessionUser: jest.fn(),
}));
jest.mocked(usePublicSessionUser).mockReturnValue({
    user: {},
} as any);

const mockNewFolderName = 'New Folder';
const mockNewFolderId = 'folderId';
const mockDocumentId = 'documentId';
const mockRenameLink = jest.fn().mockResolvedValue(true);
const mockCreateFolder = jest.fn().mockResolvedValue(mockNewFolderId);
const mockCreateDocument = jest.fn().mockResolvedValue(mockDocumentId);
const mockDeleteChildrenLink = jest.fn();

jest.mock('../_links/usePublicLinkActions');
jest.mocked(usePublicLinkActions).mockImplementation(() => ({
    renameLink: mockRenameLink,
    createFolder: mockCreateFolder,
    createDocument: mockCreateDocument,
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

const mockShowConfirmModal = jest.fn();
const mockDeleteLinks = jest.fn();

jest.mock('../_links/usePublicLinksActions');
jest.mocked(usePublicLinksActions).mockImplementation(() => ({
    deleteLinks: mockDeleteLinks,
}));

const mockRemoveLinksForPublicPage = jest.fn();
jest.mock('../_links/useLinksState');
jest.mocked(useLinksState).mockImplementation(
    () =>
        ({
            removeLinksForPublicPage: mockRemoveLinksForPublicPage,
        }) as any
);

const mockCreateDeletedPublicItemsNotifications = jest.fn();
jest.mock('./useListNotifications');
jest.mocked(useListNotifications).mockImplementation(
    () =>
        ({
            createDeletedPublicItemsNotifications: mockCreateDeletedPublicItemsNotifications,
        }) as any
);

describe('usePublicActions', () => {
    const mockAbortSignal = new AbortController().signal;
    const mockToken = 'token';
    const mockParentLinkId = 'parentLinkId';
    const mockLinkId = 'linkId';
    const mockNewName = 'New Name';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('renameLink', () => {
        it('should successfully rename a link and show success notification', async () => {
            const { result } = renderHook(() => usePublicActions());

            await result.current.renameLink(mockAbortSignal, {
                token: mockToken,
                linkId: mockLinkId,
                parentLinkId: mockParentLinkId,
                newName: mockNewName,
            });

            expect(mockRenameLink).toHaveBeenCalledWith(mockAbortSignal, {
                token: mockToken,
                linkId: mockLinkId,
                newName: mockNewName,
            });
            expect(mockLoadChildren).toHaveBeenCalledWith(mockAbortSignal, mockToken, mockParentLinkId, false);
            expect(mockCreateNotification).toHaveBeenCalledWith({
                text: <span className="text-pre-wrap">"New Name" renamed successfully</span>,
            });
        });

        it('should handle errors and show error notification', async () => {
            const { result } = renderHook(() => usePublicActions());

            mockRenameLink.mockRejectedValue(mockError);

            await expect(
                result.current.renameLink(mockAbortSignal, {
                    token: mockToken,
                    linkId: mockLinkId,
                    parentLinkId: mockParentLinkId,
                    newName: mockNewName,
                })
            ).rejects.toThrow(mockError);

            expect(mockRenameLink).toHaveBeenCalledWith(mockAbortSignal, {
                token: mockToken,
                linkId: mockLinkId,
                newName: mockNewName,
            });
            expect(mockShowErrorNotification).toHaveBeenCalledWith(
                mockError,
                <span className="text-pre-wrap">"New Name" failed to be renamed</span>
            );
        });
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

            expect(mockCreateFolder).toHaveBeenCalledWith(mockAbortSignal, {
                token: mockToken,
                parentLinkId: mockParentLinkId,
                name: mockNewFolderName,
            });
            expect(mockLoadChildren).toHaveBeenCalledWith(mockAbortSignal, mockToken, mockParentLinkId, false);
            expect(mockCreateNotification).toHaveBeenCalledWith({
                text: <span className="text-pre-wrap">"New Folder" created successfully</span>,
            });
            expect(newFolderId).toBe(mockNewFolderId);
        });

        it('should handle errors and show error notification', async () => {
            const { result } = renderHook(() => usePublicActions());

            mockCreateFolder.mockRejectedValue(mockError);

            await expect(
                result.current.createFolder(mockAbortSignal, mockToken, mockParentLinkId, mockNewFolderName)
            ).rejects.toThrow(mockError);

            expect(mockCreateFolder).toHaveBeenCalledWith(mockAbortSignal, {
                token: mockToken,
                parentLinkId: mockParentLinkId,
                name: mockNewFolderName,
            });
            expect(mockShowErrorNotification).toHaveBeenCalledWith(
                mockError,
                <span className="text-pre-wrap">"New Folder" failed to be created</span>
            );
        });
    });

    describe('createDocument', () => {
        it('should successfully create a document and return its id', async () => {
            const { result } = renderHook(() => usePublicActions());

            jest.useFakeTimers();
            const mockDate = new Date('2024-01-01 10:30:45');
            jest.setSystemTime(mockDate);

            const documentId = await result.current.createDocument(mockAbortSignal, mockToken, mockParentLinkId);

            expect(mockCreateDocument).toHaveBeenCalledWith(mockAbortSignal, {
                token: mockToken,
                parentLinkId: mockParentLinkId,
                name: 'Untitled document 2024-01-01 10.30.45',
            });
            expect(mockLoadChildren).toHaveBeenCalledWith(mockAbortSignal, mockToken, mockParentLinkId, false);
            expect(documentId).toBe(mockDocumentId);

            jest.useRealTimers();
        });

        it('should handle errors and show error notification', async () => {
            const { result } = renderHook(() => usePublicActions());

            mockCreateDocument.mockRejectedValue(mockError);

            await expect(result.current.createDocument(mockAbortSignal, mockToken, mockParentLinkId)).rejects.toThrow(
                mockError
            );

            expect(mockCreateDocument).toHaveBeenCalledWith(mockAbortSignal, {
                token: mockToken,
                parentLinkId: mockParentLinkId,
                name: expect.any(String),
            });
            expect(mockShowErrorNotification).toHaveBeenCalledWith(
                mockError,
                <span className="text-pre-wrap">The document failed to be created</span>
            );
        });
    });

    describe('deleteLinks', () => {
        let confirmModalHandler = { onSubmit: () => Promise.resolve() };
        beforeEach(() => {
            mockShowConfirmModal.mockImplementation((handler) => {
                confirmModalHandler = handler;
            });
        });

        it('should show confirm modal with correct messages for single file deletion', async () => {
            const { result } = renderHook(() => usePublicActions());
            const singleFileLink = [
                {
                    linkId: 'link1',
                    parentLinkId: 'parent1',
                    volumeId: 'volumeId1',
                    name: 'test-file.txt',
                    isFile: true,
                },
            ];

            await result.current.deleteLinks(mockAbortSignal, {
                token: mockToken,
                links: singleFileLink,
                showConfirmModal: mockShowConfirmModal,
            });

            expect(mockShowConfirmModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Delete test-file.txt?',
                    message: 'This will permanently delete the file you uploaded.',
                    submitText: 'Delete',
                })
            );
        });

        it('should show confirm modal with correct messages for single folder deletion', async () => {
            const { result } = renderHook(() => usePublicActions());
            const singleFolderLink = [
                {
                    linkId: 'link1',
                    parentLinkId: 'parent1',
                    volumeId: 'volumeId1',
                    name: 'test-folder',
                    isFile: false,
                },
            ];

            await result.current.deleteLinks(mockAbortSignal, {
                token: mockToken,
                links: singleFolderLink,
                showConfirmModal: mockShowConfirmModal,
            });

            expect(mockShowConfirmModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Delete test-folder?',
                    message: 'This will permanently delete the folder you uploaded.',
                    submitText: 'Delete',
                })
            );
        });

        it('should show confirm modal with correct messages for multiple items deletion', async () => {
            const { result } = renderHook(() => usePublicActions());
            const multipleLinks = [
                {
                    linkId: 'link1',
                    parentLinkId: 'parent1',
                    volumeId: 'volumeId1',
                    name: 'test-file.txt',
                    isFile: true,
                },
                {
                    linkId: 'link2',
                    parentLinkId: 'parent1',
                    volumeId: 'volumeId1',
                    name: 'test-folder',
                    isFile: false,
                },
            ];

            await result.current.deleteLinks(mockAbortSignal, {
                token: mockToken,
                links: multipleLinks,
                showConfirmModal: mockShowConfirmModal,
            });

            expect(mockShowConfirmModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Delete 2 items?',
                    message: 'This will permanently delete the selected items you uploaded.',
                    submitText: 'Delete',
                })
            );
        });

        it('should handle successful deletion and update state', async () => {
            const { result } = renderHook(() => usePublicActions());
            const links = [
                {
                    linkId: 'link1',
                    parentLinkId: 'parent1',
                    volumeId: 'volumeId1',
                    name: 'test-file.txt',
                    isFile: true,
                },
            ];

            mockDeleteLinks.mockResolvedValue({
                successes: ['link1'],
                failures: [],
            });

            await result.current.deleteLinks(mockAbortSignal, {
                token: mockToken,
                links,
                showConfirmModal: mockShowConfirmModal,
            });

            await confirmModalHandler.onSubmit();

            expect(mockDeleteLinks).toHaveBeenCalledWith(mockAbortSignal, {
                token: mockToken,
                linkIds: ['link1'],
                parentLinkId: 'parent1',
            });
            expect(mockRemoveLinksForPublicPage).toHaveBeenCalledWith(mockToken, ['link1']);
            expect(mockCreateDeletedPublicItemsNotifications).toHaveBeenCalledWith(
                [{ ...links[0], rootShareId: mockToken }],
                ['link1'],
                []
            );
        });

        it('should handle partial failures during deletion', async () => {
            const { result } = renderHook(() => usePublicActions());
            const links = [
                {
                    linkId: 'link1',
                    parentLinkId: 'parent1',
                    volumeId: 'volumeId1',
                    name: 'test-file1.txt',
                    isFile: true,
                },
                {
                    linkId: 'link2',
                    parentLinkId: 'parent1',
                    volumeId: 'volumeId1',
                    name: 'test-file2.txt',
                    isFile: true,
                },
            ];

            mockDeleteLinks.mockResolvedValue({
                successes: ['link1'],
                failures: ['link2'],
            });

            await result.current.deleteLinks(mockAbortSignal, {
                token: mockToken,
                links,
                showConfirmModal: mockShowConfirmModal,
            });

            await confirmModalHandler.onSubmit();

            expect(mockRemoveLinksForPublicPage).toHaveBeenCalledWith(mockToken, ['link1']);
            expect(mockCreateDeletedPublicItemsNotifications).toHaveBeenCalledWith(
                links.map((link) => ({ ...link, rootShareId: mockToken })),
                ['link1'],
                ['link2']
            );
        });

        it('should show error notification when trying to delete non-empty folders', async () => {
            const { result } = renderHook(() => usePublicActions());
            const links = [
                {
                    linkId: 'link1',
                    parentLinkId: 'parent1',
                    volumeId: 'volumeId1',
                    name: 'test-folder1',
                    isFile: false,
                },
                {
                    linkId: 'link2',
                    parentLinkId: 'parent1',
                    volumeId: 'volumeId1',
                    name: 'test-folder2',
                    isFile: false,
                },
            ];

            mockDeleteLinks.mockResolvedValue({
                successes: [],
                failures: [],
                notAllowedErrorCount: 2,
            });

            await result.current.deleteLinks(mockAbortSignal, {
                token: mockToken,
                links,
                showConfirmModal: mockShowConfirmModal,
            });

            await confirmModalHandler.onSubmit();

            expect(mockDeleteLinks).toHaveBeenCalledWith(mockAbortSignal, {
                token: mockToken,
                linkIds: ['link1', 'link2'],
                parentLinkId: 'parent1',
            });
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: "Sorry, we couldn't delete the folders because they are not empty.",
            });
            expect(mockCreateDeletedPublicItemsNotifications).not.toHaveBeenCalled();
        });
    });
});
