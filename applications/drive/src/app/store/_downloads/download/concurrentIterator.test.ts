import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { MAX_DOWNLOADING_BLOCKS_LOAD } from '../constants';
import type { DownloadCallbacks } from '../interface';
import ConcurrentIterator from './concurrentIterator';
import type { NestedLinkDownload } from './interface';

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

    it('cancels from pause', async () => {
        const bigFileSize = FILE_CHUNK_SIZE * MAX_DOWNLOADING_BLOCKS_LOAD * 2;
        const c = new ConcurrentIterator();
        const g = c.iterate(generateLinks(5, bigFileSize), {} as DownloadCallbacks, mockLog);

        g.next();
        await wait(500); // 500ms should be enough to generate first batch.
        c.cancel();

        expect(mockDownloadLinkFile).toBeCalledTimes(1);
        expect(mockStart).toBeCalledTimes(1);
        expect(mockCancel).toBeCalledTimes(1);
    });
});
