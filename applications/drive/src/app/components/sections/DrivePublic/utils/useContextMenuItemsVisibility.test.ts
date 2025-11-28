import { renderHook } from '@testing-library/react-hooks';

import type { DecryptedLink } from '../../../../store';
import { useContextMenuItemsVisibility } from './useContextMenuItemsVisibility';

jest.mock('@proton/shared/lib/helpers/preview', () => ({
    isPreviewAvailable: jest.fn(),
}));

jest.mock('@proton/shared/lib/helpers/mimetype', () => ({
    mimeTypeToOpenInDocsType: jest.fn(),
}));

jest.mock('../../../../store', () => ({
    useDownloadScanFlag: jest.fn(),
}));

jest.mock('../../../../store/_documents/useDriveDocsSheetsFF', () => ({
    useIsSheetsEnabled: jest.fn(),
}));

import { mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { useDownloadScanFlag } from '../../../../store';
import { useIsSheetsEnabled } from '../../../../store/_documents/useDriveDocsSheetsFF';

const mockedIsPreviewAvailable = jest.mocked(isPreviewAvailable);
const mockedMimeTypeToOpenInDocsType = jest.mocked(mimeTypeToOpenInDocsType);
const mockedUseDownloadScanFlag = jest.mocked(useDownloadScanFlag);
const mockedUseIsSheetsEnabled = jest.mocked(useIsSheetsEnabled);

const createMockLink = (options: Partial<DecryptedLink> = {}): DecryptedLink =>
    ({
        linkId: '1',
        isFile: true,
        mimeType: 'application/pdf',
        size: 1024,
        name: 'test.pdf',
        ...options,
    }) as DecryptedLink;

describe('useContextMenuItemsVisibility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedIsPreviewAvailable.mockReturnValue(false);
        mockedMimeTypeToOpenInDocsType.mockReturnValue(undefined);
        mockedUseDownloadScanFlag.mockReturnValue(false);
        mockedUseIsSheetsEnabled.mockReturnValue(false);
    });

    describe('canShowPreview', () => {
        it('returns true when single file with previewable mime type', () => {
            mockedIsPreviewAvailable.mockReturnValue(true);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'image/png' })],
                })
            );

            expect(result.current.canShowPreview).toBe(true);
            expect(mockedIsPreviewAvailable).toHaveBeenCalledWith('image/png', 1024);
        });

        it('returns false when multiple files selected', () => {
            mockedIsPreviewAvailable.mockReturnValue(true);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [
                        createMockLink({ linkId: '1', mimeType: 'image/png' }),
                        createMockLink({ linkId: '2', mimeType: 'image/jpg' }),
                    ],
                })
            );

            expect(result.current.canShowPreview).toBe(false);
        });

        it('returns false when selected item is a folder', () => {
            mockedIsPreviewAvailable.mockReturnValue(true);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ isFile: false })],
                })
            );

            expect(result.current.canShowPreview).toBe(false);
        });

        it('returns false when mime type is not previewable', () => {
            mockedIsPreviewAvailable.mockReturnValue(false);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/unknown' })],
                })
            );

            expect(result.current.canShowPreview).toBe(false);
        });

        it('returns false when mime type is missing', () => {
            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: undefined })],
                })
            );

            expect(result.current.canShowPreview).toBe(false);
        });

        it('returns false when no files selected', () => {
            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [],
                })
            );

            expect(result.current.canShowPreview).toBe(false);
        });
    });

    describe('canOpenInDocs', () => {
        it('returns true for single document file when sheets not required', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue({ type: 'document', isNative: true });

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/vnd.proton.doc' })],
                })
            );

            expect(result.current.canOpenInDocs).toBe(true);
        });

        it('returns true for single spreadsheet file when sheets enabled', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue({ type: 'spreadsheet', isNative: true });
            mockedUseIsSheetsEnabled.mockReturnValue(true);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/vnd.proton.sheet' })],
                })
            );

            expect(result.current.canOpenInDocs).toBe(true);
        });

        it('returns false for single spreadsheet file when sheets disabled', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue({ type: 'spreadsheet', isNative: true });
            mockedUseIsSheetsEnabled.mockReturnValue(false);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/vnd.proton.sheet' })],
                })
            );

            expect(result.current.canOpenInDocs).toBe(false);
        });

        it('returns false when multiple files selected', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue({ type: 'document', isNative: true });

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [
                        createMockLink({ linkId: '1', mimeType: 'application/vnd.proton.doc' }),
                        createMockLink({ linkId: '2', mimeType: 'application/vnd.proton.doc' }),
                    ],
                })
            );

            expect(result.current.canOpenInDocs).toBe(false);
        });

        it('returns false when file is not a proton document', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue(undefined);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/pdf' })],
                })
            );

            expect(result.current.canOpenInDocs).toBe(false);
        });

        it('returns false when no files selected', () => {
            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [],
                })
            );

            expect(result.current.canOpenInDocs).toBe(false);
        });
    });

    describe('showDownloadDocument', () => {
        it('returns true when single proton document', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue({ type: 'document', isNative: true });

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/vnd.proton.doc' })],
                })
            );

            expect(result.current.showDownloadDocument).toBe(true);
        });

        it('returns false when multiple files selected', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue({ type: 'document', isNative: true });

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [
                        createMockLink({ linkId: '1', mimeType: 'application/vnd.proton.doc' }),
                        createMockLink({ linkId: '2', mimeType: 'application/vnd.proton.doc' }),
                    ],
                })
            );

            expect(result.current.showDownloadDocument).toBe(false);
        });

        it('returns false when file is not a proton document', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue(undefined);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/pdf' })],
                })
            );

            expect(result.current.showDownloadDocument).toBe(false);
        });

        it('returns false when no files selected', () => {
            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [],
                })
            );

            expect(result.current.showDownloadDocument).toBe(false);
        });

        it('returns true for spreadsheet regardless of sheets flag', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue({ type: 'spreadsheet', isNative: true });
            mockedUseIsSheetsEnabled.mockReturnValue(false);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/vnd.proton.sheet' })],
                })
            );

            expect(result.current.showDownloadDocument).toBe(true);
        });
    });

    describe('showDownloadScanButton', () => {
        it('returns true when download scan enabled and no proton documents', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue(undefined);
            mockedUseDownloadScanFlag.mockReturnValue(true);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/pdf' })],
                })
            );

            expect(result.current.showDownloadScanButton).toBe(true);
        });

        it('returns false when download scan disabled', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue(undefined);
            mockedUseDownloadScanFlag.mockReturnValue(false);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/pdf' })],
                })
            );

            expect(result.current.showDownloadScanButton).toBe(false);
        });

        it('returns false when proton documents are present', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue({ type: 'document', isNative: true });
            mockedUseDownloadScanFlag.mockReturnValue(true);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [createMockLink({ mimeType: 'application/vnd.proton.doc' })],
                })
            );

            expect(result.current.showDownloadScanButton).toBe(false);
        });

        it('returns true when no files selected and scan enabled', () => {
            mockedUseDownloadScanFlag.mockReturnValue(true);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [],
                })
            );

            expect(result.current.showDownloadScanButton).toBe(true);
        });

        it('returns true when multiple non-proton files and scan enabled', () => {
            mockedMimeTypeToOpenInDocsType.mockReturnValue(undefined);
            mockedUseDownloadScanFlag.mockReturnValue(true);

            const { result } = renderHook(() =>
                useContextMenuItemsVisibility({
                    selectedLinks: [
                        createMockLink({ linkId: '1', mimeType: 'application/pdf' }),
                        createMockLink({ linkId: '2', mimeType: 'image/png' }),
                    ],
                })
            );

            expect(result.current.showDownloadScanButton).toBe(true);
        });
    });
});
