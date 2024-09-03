import generateUID from '@proton/atoms/generateUID';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';

import { waitUntil } from '../../../utils/async';
import { MAX_DOWNLOADING_BLOCKS_LOAD, MAX_DOWNLOADING_FILES_LOAD } from '../constants';
import type { DownloadCallbacks, DownloadStreamControls, LogCallback } from '../interface';
import initDownloadLinkFile from './downloadLinkFile';
import type { NestedLinkDownload, StartedNestedLinkDownload } from './interface';

/**
 * ConcurrentIterator iterates over provided generator of links and starts
 * download of files in concurrent fashion.
 */
export default class ConcurrentIterator {
    private paused: boolean;

    private canceled: boolean;

    private fileControlers: Map<string, DownloadStreamControls>;

    private loadSize: number;

    constructor() {
        this.paused = false;
        this.canceled = false;
        this.fileControlers = new Map();
        this.loadSize = 0;
    }

    async *iterate(
        links: AsyncGenerator<NestedLinkDownload>,
        callbacks: DownloadCallbacks,
        log: LogCallback,
        options?: { virusScan?: boolean }
    ): AsyncGenerator<StartedNestedLinkDownload> {
        for await (const link of links) {
            if (this.paused) {
                await waitUntil(() => !this.paused);
            }
            if (this.canceled) {
                return;
            }

            if (!link.isFile) {
                yield link as StartedNestedLinkDownload;
            } else {
                log(`ConcurrentIterator: Waiting for load size to decrease. link: ${link.linkId}`);
                await waitUntil(
                    () =>
                        (this.loadSize < FILE_CHUNK_SIZE * MAX_DOWNLOADING_BLOCKS_LOAD &&
                            this.fileControlers.size < MAX_DOWNLOADING_FILES_LOAD) ||
                        this.canceled
                );
                if (this.canceled) {
                    log(`ConcurrentIterator: Waiting canceled. link: ${link.linkId}`);
                    return;
                }

                log(`ConcurrentIterator: Waiting finished. link: ${link.linkId}`);

                const uniqueId = generateUID();
                const controls = initDownloadLinkFile(
                    link,
                    {
                        ...callbacks,
                        // onInit and onFinish are ignored per file when downloading
                        // multiple files - we care only about total onInit or onFinish.
                        onInit: undefined,
                        onProgress: (linkIds: string[], bytes: number) => {
                            callbacks.onProgress?.([...link.parentLinkIds, ...linkIds], bytes);
                            this.loadSize -= bytes;
                        },
                        onFinish: () => {
                            this.fileControlers.delete(uniqueId);
                        },
                    },
                    log,
                    options
                );
                this.loadSize += link.size;
                this.fileControlers.set(uniqueId, controls);
                const stream = controls.start();
                yield {
                    ...link,
                    stream,
                };
            }
        }
    }

    pause() {
        this.paused = true;
        this.fileControlers.forEach((controls) => controls.pause());
    }

    resume() {
        this.paused = false;
        this.fileControlers.forEach((controls) => controls.resume());
    }

    cancel() {
        this.canceled = true;
        this.paused = false; // To unpause waits and terminate operation.
        this.fileControlers.forEach((controls) => controls.cancel());
    }
}
