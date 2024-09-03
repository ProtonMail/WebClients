import generateUID from '@proton/utils/generateUID';

import { waitUntil } from '../../../utils/async';
import type { DownloadCallbacks, DownloadStreamControls, LogCallback } from '../interface';
import initDownloadLinkFile from './downloadLinkFile';
import type { NestedLinkDownload, StartedNestedLinkDownload } from './interface';

/**
 * ConcurrentIterator iterates over provided generator of links and starts
 * download of files in concurrent fashion.
 *
 * TODO: It is downloading file concurrently only if the consumer of iterator
 * is working concurrently. In our setup, ConcurrentIterator is always used
 * in combination with ArchiveGenerator which consumes one link after another.
 *
 * WARNING: There is no safety. If consumer consumes all links at once, this
 * class will start downloading all links at once too. Use wisely.
 *
 * FIXME: There was a safety. But because ArchiveGenerator doesnt use it and
 * there is bug with some edge case causing stuck download, the limit was
 * removed. It is not super clear where the problem was. It looks like around
 * load/progress counting - sometimes it doesn't announce all progresses via
 * onProgress. I managed reproduce by crazy pause/resume, so perhaps revert
 * of progress is at fault, but we have logs with this problem without any
 * pausing too.
 *
 * For refactor, progress, raw vs. encrypted size, what is safe and isnt, etc.
 * must be well defined and used across the whole stack to avoid such problems.
 *
 * If you find this message in late 2025, neither download refactor or Drive
 * refactor didn't happen (yet) and in that case I'm sorry.
 */
export default class ConcurrentIterator {
    private paused: boolean;

    private canceled: boolean;

    private fileControlers: Map<string, DownloadStreamControls>;

    constructor() {
        this.paused = false;
        this.canceled = false;
        this.fileControlers = new Map();
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
                        },
                        onFinish: () => {
                            this.fileControlers.delete(uniqueId);
                        },
                    },
                    log,
                    options
                );
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
