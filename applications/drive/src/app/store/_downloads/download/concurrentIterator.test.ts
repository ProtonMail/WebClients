import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { asyncGeneratorToArray } from '../../../utils/test/generator';
import { MAX_DOWNLOADING_BLOCKS_LOAD, MAX_DOWNLOADING_FILES_LOAD } from '../constants';
import { DownloadCallbacks } from '../interface';
import ConcurrentIterator from './concurrentIterator';
import { NestedLinkDownload, StartedNestedLinkDownload } from './interface';

const mockDownloadLinkFile = jest.fn();
jest.mock('./downloadLinkFile', () => {
    return (...args: any[]) => {
        return mockDownloadLinkFile(...args);
    };
});

async function* generateLinks(count: number, size = 123) {
    for (let i = 0; i < count; i++) {
        yield {
            isFile: true,
            size,
        } as NestedLinkDownload;
    }
}

describe('ConcurrentIterator', () => {
    const mockStart = jest.fn();
    const mockCancel = jest.fn();
    const mockLog = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockDownloadLinkFile.mockReturnValue({
            start: mockStart,
            cancel: mockCancel,
        });
    });

    const checkPausingGeneratingLinks = async (
        generator: AsyncGenerator<StartedNestedLinkDownload>,
        callsBeforePause: number,
        totalCalls: number
    ) => {
        // Start consuming so we it can generate links and hit the pause.
        const linksPromise = asyncGeneratorToArray(generator);
        await wait(500); // 500ms should be enough to generate first batch.

        // Now its in waiting mode and it waits to finish ongoing downloads.
        expect(mockDownloadLinkFile).toBeCalledTimes(callsBeforePause);
        expect(mockStart).toBeCalledTimes(callsBeforePause);
        mockDownloadLinkFile.mock.calls.forEach(([link, { onProgress, onFinish }]) => {
            onProgress('linkId', link.size);
            onFinish();
        });

        // After finishing the previous batch, wait to generate the rest.
        // Now without pausing because we don't have more than "two pages".
        const links = await linksPromise;
        expect(links.length).toBe(totalCalls);
        expect(mockDownloadLinkFile).toBeCalledTimes(totalCalls);
        expect(mockStart).toBeCalledTimes(totalCalls);
    };

    it('pauses when reaching MAX_DOWNLOADING_FILES_LOAD', async () => {
        const c = new ConcurrentIterator();
        const g = c.iterate(generateLinks(MAX_DOWNLOADING_FILES_LOAD * 2), {} as DownloadCallbacks, mockLog);
        await checkPausingGeneratingLinks(g, MAX_DOWNLOADING_FILES_LOAD, MAX_DOWNLOADING_FILES_LOAD * 2);
    });

    it('pauses when reaching MAX_DOWNLOADING_BLOCKS_LOAD', async () => {
        const bigFileSize = FILE_CHUNK_SIZE * MAX_DOWNLOADING_BLOCKS_LOAD * 2;
        const c = new ConcurrentIterator();
        const g = c.iterate(generateLinks(2, bigFileSize), {} as DownloadCallbacks, mockLog);
        await checkPausingGeneratingLinks(g, 1, 2);
    });

    it('cancels from pause', async () => {
        const bigFileSize = FILE_CHUNK_SIZE * MAX_DOWNLOADING_BLOCKS_LOAD * 2;
        const c = new ConcurrentIterator();
        const g = c.iterate(generateLinks(5, bigFileSize), {} as DownloadCallbacks, mockLog);

        // Start consuming so we it can generate links and hit the pause.
        const linksPromise = asyncGeneratorToArray(g);
        await wait(500); // 500ms should be enough to generate first batch.
        c.cancel();

        const links = await linksPromise;
        expect(links.length).toBe(1);
        expect(mockDownloadLinkFile).toBeCalledTimes(1);
        expect(mockStart).toBeCalledTimes(1);
        expect(mockCancel).toBeCalledTimes(1);
    });
});
