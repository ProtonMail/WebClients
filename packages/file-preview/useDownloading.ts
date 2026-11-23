import { useRef } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

export type DownloadHandler = () => void | Promise<void>;

/** Keeps the loader visible long enough to be noticed, even when the download resolves instantly (e.g. cached). */
const MIN_DOWNLOADING_DURATION = 400;

/**
 * Wraps a download handler with a loading state and an in-flight lock.
 * While a download runs, further calls return the pending promise instead of starting a new download.
 * Wrapping an already-wrapped handler therefore shares the lock: every caller waits on the same download.
 */
const useDownloading = (onDownload?: DownloadHandler) => {
    const [downloading, withDownloading] = useLoading();
    const inFlightRef = useRef<Promise<void> | undefined>(undefined);

    const handleDownload = (): Promise<void> => {
        if (!inFlightRef.current) {
            const download = (async () => {
                try {
                    await Promise.all([onDownload?.(), wait(MIN_DOWNLOADING_DURATION)]);
                } finally {
                    inFlightRef.current = undefined;
                }
            })();
            inFlightRef.current = download;
            // The caller receives `download` and its rejection; only silence the loading tracker's copy.
            withDownloading(download).catch(noop);
        }
        return inFlightRef.current;
    };

    return [downloading, handleDownload] as const;
};

export default useDownloading;
