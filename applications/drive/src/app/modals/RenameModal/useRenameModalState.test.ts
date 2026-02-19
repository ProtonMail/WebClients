import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import type { InvalidNameError } from '@proton/drive/index';
import { type NodeEntity, NodeType } from '@proton/drive/index';
import { PROTON_DOCS_DOCUMENT_MIMETYPE, PROTON_DOCS_SPREADSHEET_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';

import type { RenameModalViewProps } from './RenameModalView';
import { useRenameModalState } from './useRenameModalState';

jest.mock('@proton/components', () => ({
    useNotifications: jest.fn(() => ({
        createNotification: jest.fn(),
    })),
}));

const mockHandleError = jest.fn();

jest.mock('../../utils/errorHandling/useSdkErrorHandler', () => ({
    useSdkErrorHandler: () => ({
        handleError: mockHandleError,
    }),
}));

const mockedGetNode = jest.fn();
const mockDrive = {
    getNode: mockedGetNode,
    renameNode: jest.fn(),
};

const createMockNode = (param: { uid: string; name: string; type: NodeType; mediaType: string }): NodeEntity =>
    ({
        uid: param.uid,
        name: param.name,
        type: param.type,
        mediaType: param.mediaType,
    }) as NodeEntity;

const DEFAULT_UID = 'uid';

const defaultProps = {
    nodeUid: DEFAULT_UID,
    drive: mockDrive as any,
    onClose: () => {},
    onExit: () => {},
    open: true,
};

const expectFetchNode = () => {
    expect(mockedGetNode).toHaveBeenCalledWith(DEFAULT_UID);
};

const expectModalStateIsLoading = (props: RenameModalViewProps) => {
    expect(props).toStrictEqual({
        loaded: false,
    });
};

const expectNameAndNameToFocus = (props: RenameModalViewProps, name: string, nameToFocus: string) => {
    expect(props).toStrictEqual({
        loaded: true,
        name,
        nameToFocus,
        nodeType: expect.anything(),
        onClose: expect.any(Function),
        onExit: expect.any(Function),
        handleSubmit: expect.any(Function),
        open: true,
    });
};

const baseError = {
    name: {
        ok: true,
        value: 'myimage.png',
    },
    activeRevision: {
        ok: true,
        value: {},
    },
    errors: undefined,
};

describe('useRenameModalState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Degraded node handling behavior', () => {
        it('should set entire name for non-degraded node', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'myimage.png',
                mediaType: 'image/png',
                type: NodeType.File,
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, 'myimage.png', 'myimage');
            });
        });

        it('should set entire name for degraded nodes with no name related errors', async () => {
            const error = {
                ...baseError,
                activeRevision: {
                    ok: false,
                    error: 'activeRevision error',
                },
            };

            const degradedNode = {
                ...createMockNode({
                    uid: DEFAULT_UID,
                    name: 'myimage.png',
                    mediaType: 'image/png',
                    type: NodeType.File,
                }),
                ...error,
            };

            mockedGetNode.mockResolvedValueOnce({ ok: false, error: degradedNode });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, 'myimage.png', 'myimage');
            });
        });

        it('should set entire name for degraded nodes with invalid name errors', async () => {
            const invalidNameError: InvalidNameError = {
                name: 'myim/ag/e.png',
                error: 'Invalid name error',
            };

            const error = {
                ...baseError,
                name: {
                    ok: false,
                    error: invalidNameError,
                },
            };

            const degradedNode = {
                ...createMockNode({
                    uid: DEFAULT_UID,
                    name: 'myimage.png',
                    mediaType: 'image/png',
                    type: NodeType.File,
                }),
                ...error,
            };

            mockedGetNode.mockResolvedValueOnce({ ok: false, error: degradedNode });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, 'myim/ag/e.png', 'myim/ag/e');
            });
        });

        it('should set empty name for degraded nodes with name errors that are not invalid', async () => {
            const error = {
                ...baseError,
                name: {
                    ok: false,
                    error: new Error('Name error'),
                },
            };

            const degradedNode = {
                ...createMockNode({
                    uid: DEFAULT_UID,
                    name: 'myimage.png',
                    mediaType: 'image/png',
                    type: NodeType.File,
                }),
                ...error,
            };

            mockedGetNode.mockResolvedValueOnce({ ok: false, error: degradedNode });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, '', '');
            });
        });
    });

    describe('Compute the filename to focus', () => {
        it('should focus the filename without the png extension', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'myimage.png',
                mediaType: 'image/png',
                type: NodeType.File,
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, 'myimage.png', 'myimage');
            });
        });

        it('should focus the filename without the vcf extension', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'myvcard.vcf',
                mediaType: 'text/vcard',
                type: NodeType.File,
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, 'myvcard.vcf', 'myvcard');
            });
        });

        it('should focus the entire filename when the name is missing', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: '.txt',
                mediaType: 'plain/text',
                type: NodeType.File,
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, '.txt', '.txt');
            });
        });

        it('should focus the filename without the docx extension', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'mydocument.docx',
                mediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                type: NodeType.File,
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, 'mydocument.docx', 'mydocument');
            });
        });

        it('should focus the entire name for folder', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'myfolder',
                type: NodeType.Folder,
                mediaType: '',
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, 'myfolder', 'myfolder');
            });
        });

        it('should focus the entire name for folder, even with a dot inside', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'myfolder.withdot',
                type: NodeType.Folder,
                mediaType: '',
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, 'myfolder.withdot', 'myfolder.withdot');
            });
        });

        it('should focus the entire name for proton documents', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'myprotondocument.with_dot_inside',
                type: NodeType.File,
                mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(
                    result.current,
                    'myprotondocument.with_dot_inside',
                    'myprotondocument.with_dot_inside'
                );
            });
        });

        it('should focus the entire name for proton sheets', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'myprotonsheets.with_dot_inside',
                type: NodeType.File,
                mediaType: PROTON_DOCS_SPREADSHEET_MIMETYPE,
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(
                    result.current,
                    'myprotonsheets.with_dot_inside',
                    'myprotonsheets.with_dot_inside'
                );
            });
        });

        it('should focus the name only for file when missing the mediatype', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'somefile.mp3',
                type: NodeType.File,
                mediaType: '',
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            expectFetchNode();
            expectModalStateIsLoading(result.current);

            await waitFor(() => {
                expectNameAndNameToFocus(result.current, 'somefile.mp3', 'somefile');
            });
        });
    });

    describe('Error handling', () => {
        it('should call handleError and exit the modal when getNode throws', async () => {
            const onExit = jest.fn();
            const error = new Error('fetch error');
            mockedGetNode.mockRejectedValueOnce(error);

            renderHook(() => useRenameModalState({ ...defaultProps, onExit }));

            await waitFor(() => {
                expect(mockHandleError).toHaveBeenCalledWith(error, { showNotification: true });
                expect(onExit).toHaveBeenCalled();
            });
        });

        it('should call handleError when renameNode throws', async () => {
            const node = createMockNode({
                uid: DEFAULT_UID,
                name: 'myimage.png',
                mediaType: 'image/png',
                type: NodeType.File,
            });
            mockedGetNode.mockResolvedValueOnce({ ok: true, value: node });
            const error = new Error('rename error');
            mockDrive.renameNode.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useRenameModalState(defaultProps));

            await waitFor(() => {
                expect(result.current).toMatchObject({ loaded: true });
            });

            await (result.current as Extract<RenameModalViewProps, { loaded: true }>).handleSubmit('newname.png');

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: expect.stringContaining('newname.png'),
                extra: { nodeUid: DEFAULT_UID },
            });
        });
    });
});
