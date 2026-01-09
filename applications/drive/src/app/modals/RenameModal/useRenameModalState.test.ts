import { renderHook } from '@testing-library/react-hooks';

import { PROTON_DOCS_DOCUMENT_MIMETYPE, PROTON_DOCS_SPREADSHEET_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';

import { useRenameModalState } from './useRenameModalState';

jest.mock('@proton/components', () => ({
    useNotifications: jest.fn(() => ({
        createNotification: jest.fn(),
    })),
}));

jest.mock('@proton/drive/index', () => ({
    useDrive: jest.fn(() => ({
        drive: {
            renameNode: jest.fn(),
        },
    })),
}));

const defaultProps = {
    onClose: () => {},
    onExit: () => {},
    onSubmit: (_newName: string) => Promise.resolve(),
    volumeId: 'VOLUME_ID',
    linkId: 'LINK_ID',
    open: true,
    name: 'DEFAULT_NAME',
    isFile: true,
    isDoc: false,
    mediaType: 'DEFAULT_MEDIATYPE',
};

describe('useRenameModalState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Compute the filename to focus', () => {
        it('should focus the filename without the png extension', async () => {
            const { result } = renderHook(() =>
                useRenameModalState({
                    ...defaultProps,
                    name: 'myimage.png',
                    mediaType: 'image/png',
                })
            );

            expect(result.current.nameToFocus).toBe('myimage');
        });

        it('should focus the filename without the vcf extension', async () => {
            const { result } = renderHook(() =>
                useRenameModalState({
                    ...defaultProps,
                    name: 'myvcard.vcf',
                    mediaType: 'text/vcard',
                })
            );

            expect(result.current.nameToFocus).toBe('myvcard');
        });

        it('should focus the entire filename when the name is missing', async () => {
            const { result } = renderHook(() =>
                useRenameModalState({
                    ...defaultProps,
                    name: '.txt',
                    mediaType: 'plain/text',
                })
            );

            expect(result.current.nameToFocus).toBe('.txt');
        });

        it('should focus the filename without the docx extension', async () => {
            const { result } = renderHook(() =>
                useRenameModalState({
                    ...defaultProps,
                    name: 'mydocument.docx',
                    mediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                })
            );

            expect(result.current.nameToFocus).toBe('mydocument');
        });

        it('should focus the entire name for folder', async () => {
            const { result } = renderHook(() =>
                useRenameModalState({
                    ...defaultProps,
                    name: 'myfolder',
                    isFile: false,
                })
            );

            expect(result.current.nameToFocus).toBe('myfolder');
        });

        it('should focus the entire name for folder, even with a dot inside', async () => {
            const { result } = renderHook(() =>
                useRenameModalState({
                    ...defaultProps,
                    name: 'myfolder.withdot',
                    isFile: false,
                })
            );

            expect(result.current.nameToFocus).toBe('myfolder.withdot');
        });

        it('should focus the entire name for proton documents', async () => {
            const { result } = renderHook(() =>
                useRenameModalState({
                    ...defaultProps,
                    name: 'myprotondocument.with_dot_inside',
                    mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
                })
            );

            expect(result.current.nameToFocus).toBe('myprotondocument.with_dot_inside');
        });

        it('should focus the entire name for proton sheets', async () => {
            const { result } = renderHook(() =>
                useRenameModalState({
                    ...defaultProps,
                    name: 'myprotonsheets.with_dot_inside',
                    mediaType: PROTON_DOCS_SPREADSHEET_MIMETYPE,
                })
            );

            expect(result.current.nameToFocus).toBe('myprotonsheets.with_dot_inside');
        });

        it('should focus the entire name when missing the mediatype', async () => {
            const { result } = renderHook(() =>
                useRenameModalState({
                    ...defaultProps,
                    name: 'somefile.mp3',
                    mediaType: undefined,
                })
            );

            expect(result.current.nameToFocus).toBe('somefile.mp3');
        });
    });
});
