import { act, renderHook } from '@testing-library/react-hooks';

import { FILE_CHUNK_SIZE, SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { TransferState } from '../../../components/TransferManager/transfer';
import type { LinkDownload } from '../interface';
import type { Download } from './interface';
import useDownloadControl from './useDownloadControl';

function makeDownload(id: string, state: TransferState, links: LinkDownload[], setSize = true): Download {
    return {
        id,
        startDate: new Date(),
        state,
        links,
        meta: {
            filename: links.length === 1 ? links[0].name : `My files.zip`,
            mimeType: links.length === 1 ? links[0].mimeType : SupportedMimeTypes.zip,
            size: setSize ? links.reduce((sum, link) => sum + link.size, 0) : undefined,
        },
        retries: 0,
    };
}

function makeDownloadLink(name: string, size = 2 * FILE_CHUNK_SIZE): LinkDownload {
    return {
        isFile: true,
        shareId: 'shareId',
        linkId: 'linkId',
        name,
        mimeType: 'text/plain',
        size,
        signatureAddress: 'address',
    };
}

describe('useDownloadControl', () => {
    const mockUpdateWithCallback = jest.fn();
    const mockRemoveFromQueue = jest.fn();
    const mockClearQueue = jest.fn();

    const testDownloads: Download[] = [
        makeDownload('init', TransferState.Initializing, [makeDownloadLink('init.txt')]),
        makeDownload('pending', TransferState.Pending, [makeDownloadLink('pending.txt')]),
        makeDownload('progress', TransferState.Progress, [makeDownloadLink('progress.txt', 2 * FILE_CHUNK_SIZE + 42)]),
        makeDownload('progressMulti', TransferState.Progress, [
            makeDownloadLink('progress1.txt'),
            makeDownloadLink('progress2.txt'),
            makeDownloadLink('progress3.txt'),
        ]),
        makeDownload('big', TransferState.Progress, [makeDownloadLink('big.txt', 100 * FILE_CHUNK_SIZE)]),
        makeDownload('done', TransferState.Done, [makeDownloadLink('done.txt')]),
    ];

    beforeEach(() => {
        mockUpdateWithCallback.mockClear();
        mockRemoveFromQueue.mockClear();
        mockClearQueue.mockClear();
    });

    it('calculates download block load', () => {
        const { result: hook } = renderHook(() =>
            useDownloadControl(testDownloads, mockUpdateWithCallback, mockRemoveFromQueue, mockClearQueue)
        );

        const controls = { start: jest.fn(), pause: jest.fn(), resume: jest.fn(), cancel: jest.fn() };
        act(() => {
            hook.current.add('progress', controls);
            hook.current.updateProgress('progress', ['linkId'], FILE_CHUNK_SIZE);
            expect(hook.current.calculateDownloadBlockLoad()).toBe(
                // 2 progress (one chunk done above, one and a bit to go) + 2*3 progressMulti + 100 big
                2 + 6 + 100
            );
        });
    });

    it('does not calculate download block load', () => {
        const downloads = [
            ...testDownloads,
            makeDownload('withoutSize', TransferState.Progress, [makeDownloadLink('withoutSize.txt')], false),
        ];
        const { result: hook } = renderHook(() =>
            useDownloadControl(downloads, mockUpdateWithCallback, mockRemoveFromQueue, mockClearQueue)
        );

        const controls = { start: jest.fn(), pause: jest.fn(), resume: jest.fn(), cancel: jest.fn() };
        act(() => {
            hook.current.add('progress', controls);
            hook.current.updateProgress('progress', ['linkId'], FILE_CHUNK_SIZE);
            expect(hook.current.calculateDownloadBlockLoad()).toBe(undefined);
        });
    });

    it('keeps link progresses', () => {
        const { result: hook } = renderHook(() =>
            useDownloadControl(testDownloads, mockUpdateWithCallback, mockRemoveFromQueue, mockClearQueue)
        );

        const controls = { start: jest.fn(), pause: jest.fn(), resume: jest.fn(), cancel: jest.fn() };
        act(() => {
            hook.current.add('progress', controls);
            // Start some progress before we know size.
            hook.current.updateProgress('progress', ['linkId1'], 10);
            hook.current.updateProgress('progress', ['linkId2'], 20);
            hook.current.updateLinkSizes('progress', { linkId1: 12, linkId2: 34 });
            // Continue some progress after we know size.
            hook.current.updateProgress('progress', ['linkId2'], 5);
            expect(hook.current.getLinksProgress()).toMatchObject({
                linkId1: { progress: 10, total: 12 },
                linkId2: { progress: 25, total: 34 },
            });
        });
    });
});
