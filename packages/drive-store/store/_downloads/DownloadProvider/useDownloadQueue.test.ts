import { act, renderHook } from '@testing-library/react-hooks';

import { TransferState } from '../../../components/TransferManager/transfer';
import type { LinkDownload } from '../interface';
import type { Download, UpdateCallback, UpdateData, UpdateFilter, UpdateState } from './interface';
import useDownloadQueue from './useDownloadQueue';

function makeDownloadLink(name: string, isFile = true): LinkDownload {
    return {
        isFile,
        shareId: 'shareId',
        linkId: name,
        name,
        mimeType: isFile ? 'text/plain' : 'Folder',
        size: 1234,
        signatureAddress: 'address',
    };
}

describe('useDownloadQueue', () => {
    let hook: {
        current: {
            downloads: Download[];
            add: (links: LinkDownload[]) => Promise<void>;
            updateState: (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState) => void;
            updateWithData: (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState, data: UpdateData) => void;
            updateWithCallback: (
                idOrFilter: UpdateFilter,
                newStateOrCallback: UpdateState,
                callback: UpdateCallback
            ) => void;
            remove: (idOrFilter: UpdateFilter, callback?: UpdateCallback) => void;
        };
    };

    const mockLog = jest.fn();

    let fileTransferId: string;
    let folderTransferId: string;
    let singleTransferIds: string[];

    beforeEach(async () => {
        const { result } = renderHook(() => useDownloadQueue(mockLog));
        hook = result;

        await act(async () => {
            await hook.current.add([makeDownloadLink('file.txt')]);
            await hook.current.add([makeDownloadLink('folder', false)]);
            await hook.current.add([makeDownloadLink('file.txt'), makeDownloadLink('folder', false)]);
        });

        fileTransferId = hook.current.downloads[0].id;
        folderTransferId = hook.current.downloads[1].id;
        singleTransferIds = [fileTransferId, folderTransferId];
    });

    it('adding same file transfer fails', async () => {
        await act(async () => {
            const promise = hook.current.add([makeDownloadLink('file.txt')]);
            await expect(promise).rejects.toThrowError('File "file.txt" is already downloading');
        });
    });

    it('adding same folder transfer fails', async () => {
        await act(async () => {
            const promise = hook.current.add([makeDownloadLink('folder', false)]);
            await expect(promise).rejects.toThrowError('Folder "folder" is already downloading');
        });
    });

    it('adding same files transfer fails', async () => {
        await act(async () => {
            const promise = hook.current.add([makeDownloadLink('file.txt'), makeDownloadLink('folder', false)]);
            await expect(promise).rejects.toThrowError('File selection is already downloading');
        });
    });

    it('adding different transfer', async () => {
        await act(async () => {
            const promise = hook.current.add([makeDownloadLink('file2.txt')]);
            await expect(promise).resolves.toBe(undefined);
        });
        expect(hook.current.downloads.length).toBe(4);
    });

    it('updates state using id', () => {
        act(() => {
            hook.current.updateState(fileTransferId, TransferState.Canceled);
        });
        expect(hook.current.downloads.map(({ state }) => state)).toMatchObject([
            TransferState.Canceled,
            TransferState.Pending,
            TransferState.Pending,
        ]);
    });

    it('updates state using filter', () => {
        act(() => {
            hook.current.updateState(({ id }) => singleTransferIds.includes(id), TransferState.Canceled);
        });
        expect(hook.current.downloads.map(({ state }) => state)).toMatchObject([
            TransferState.Canceled,
            TransferState.Canceled,
            TransferState.Pending,
        ]);
    });

    it('updates state using callback', () => {
        act(() => {
            hook.current.updateState(
                () => true,
                ({ id }) => (id === fileTransferId ? TransferState.Error : TransferState.Canceled)
            );
        });
        expect(hook.current.downloads.map(({ state }) => state)).toMatchObject([
            TransferState.Error,
            TransferState.Canceled,
            TransferState.Canceled,
        ]);
    });

    it('updates state with data', () => {
        act(() => {
            hook.current.updateWithData(fileTransferId, TransferState.Error, {
                size: 42,
                error: new Error('nope'),
                signatureIssueLink: makeDownloadLink('name'),
                signatureStatus: 2,
            });
        });
        expect(hook.current.downloads[0]).toMatchObject({
            state: TransferState.Error,
            error: new Error('nope'),
            meta: {
                filename: 'file.txt',
                mimeType: 'text/plain',
                size: 42,
            },
            signatureIssueLink: makeDownloadLink('name'),
            signatureStatus: 2,
        });
    });

    it('updates state with callback', () => {
        const mockCallback = jest.fn();
        act(() => {
            hook.current.updateWithCallback(
                ({ id }) => singleTransferIds.includes(id),
                TransferState.Progress,
                mockCallback
            );
        });
        expect(mockCallback.mock.calls).toMatchObject([
            [{ meta: { filename: 'file.txt' } }],
            [{ meta: { filename: 'folder.zip' } }],
        ]);
    });

    it('removes transfer from the queue using id', () => {
        const mockCallback = jest.fn();
        act(() => {
            hook.current.remove(fileTransferId, mockCallback);
        });
        expect(mockCallback.mock.calls).toMatchObject([[{ meta: { filename: 'file.txt' } }]]);
        expect(hook.current.downloads).toMatchObject([
            {
                links: [{ linkId: 'folder' }],
            },
            {
                links: [{ linkId: 'file.txt' }, { linkId: 'folder' }],
            },
        ]);
    });

    it('removes transfer from the queue using filter', () => {
        const mockCallback = jest.fn();
        act(() => {
            hook.current.remove(({ id }) => singleTransferIds.includes(id), mockCallback);
        });
        expect(mockCallback.mock.calls).toMatchObject([
            [{ meta: { filename: 'file.txt' } }],
            [{ meta: { filename: 'folder.zip' } }],
        ]);
        expect(hook.current.downloads).toMatchObject([
            {
                links: [{ linkId: 'file.txt' }, { linkId: 'folder' }],
            },
        ]);
    });

    it('set downloads as retried using data', () => {
        act(() => {
            hook.current.updateWithData(fileTransferId, TransferState.Pending, {
                retry: true,
            });
        });
        expect(hook.current.downloads[0].retries).toEqual(1);
        act(() => {
            hook.current.updateWithData(fileTransferId, TransferState.Progress, {});
        });
        expect(hook.current.downloads[0].retries).toEqual(1);
    });
    it('set downloads as retried if resumed after error', () => {
        act(() => {
            hook.current.updateWithData(fileTransferId, TransferState.Error, {});
        });
        expect(hook.current.downloads[0].retries).toEqual(0);
        act(() => {
            hook.current.updateWithData(fileTransferId, TransferState.Pending, {});
        });
        expect(hook.current.downloads[0].retries).toEqual(1);
    });
});
