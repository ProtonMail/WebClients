import { generateUID } from '@proton/components';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';

import { waitUntil } from '../../../utils/async';
import { LinkType } from '../../links';
import { MAX_DOWNLOADING_BLOCKS_LOAD, MAX_DOWNLOADING_FILES_LOAD } from '../constants';
import { DownloadStreamControls, DownloadCallbacks } from '../interface';
import { NestedLinkDownload, StartedNestedLinkDownload } from './interface';
import initDownloadLinkFile from './downloadLinkFile';

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
        callbacks: DownloadCallbacks
    ): AsyncGenerator<StartedNestedLinkDownload> {
        for await (const link of links) {
            if (this.paused) {
                await waitUntil(() => !this.paused);
            }
            if (this.canceled) {
                return;
            }

            if (link.type === LinkType.FOLDER) {
                yield link as StartedNestedLinkDownload;
            } else {
                await waitUntil(
                    () =>
                        this.loadSize < FILE_CHUNK_SIZE * MAX_DOWNLOADING_BLOCKS_LOAD &&
                        this.fileControlers.size < MAX_DOWNLOADING_FILES_LOAD
                );

                const uniqueId = generateUID();
                const controls = initDownloadLinkFile(link, {
                    ...callbacks,
                    // onInit and onFinish are ignored per file when downloading
                    // multiple files - we care only about total onInit or onFinish.
                    onInit: undefined,
                    onProgress: (bytes: number) => {
                        callbacks.onProgress?.(bytes);
                        this.loadSize -= bytes;
                    },
                    onFinish: () => {
                        this.fileControlers.delete(uniqueId);
                    },
                });
                this.loadSize += link.size;
                const stream = controls.start();
                this.fileControlers.set(uniqueId, controls);
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
        this.paused = false; // To unpause waits and terminate operation.
        this.canceled = true;
        this.fileControlers.forEach((controls) => controls.cancel());
    }
}
