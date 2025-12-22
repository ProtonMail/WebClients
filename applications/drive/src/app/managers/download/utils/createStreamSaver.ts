import type { TransferMeta } from '../../../components/TransferManager/transfer';
import fileSaver from '../../../store/_downloads/fileSaver/fileSaver';
import { loadCreateReadableStreamWrapper } from '../../../utils/webStreamsPolyfill';

export type StreamSaverController = {
    writable: WritableStream<Uint8Array<ArrayBuffer>>;
    finalize: () => Promise<void>;
    abort: (reason?: unknown) => Promise<void>;
};

/**
 * Builds a WritableStream that forwards data to fileSaver and exposes helpers to finish or abort the download.
 */
export const createStreamSaver = (meta: TransferMeta, log: (message: string) => void): StreamSaverController => {
    const transformStream = new TransformStream<Uint8Array<ArrayBuffer>>();
    const streamWrapperPromise = loadCreateReadableStreamWrapper(transformStream.readable);
    const streamWriter = transformStream.writable.getWriter();
    let writerSettled = false;
    let saveCompletedSuccessfully = false;
    let abortTriggered = false;

    const settleWriter = async (action: 'close' | 'abort', reason?: unknown) => {
        if (writerSettled) {
            return;
        }
        writerSettled = true;
        try {
            if (action === 'close') {
                await streamWriter.close();
            } else {
                await streamWriter.abort(reason);
            }
        } finally {
            try {
                streamWriter.releaseLock();
            } catch {
                // releaseLock can throw if we're mid-operation but
                // we're already handling all possible paths to error
            }
        }
    };

    const savePromise = streamWrapperPromise
        .then((streamForSaver) => fileSaver.instance.saveAsFile(streamForSaver, meta, log))
        .then(() => {
            saveCompletedSuccessfully = true;
        });

    return {
        writable: new WritableStream<Uint8Array<ArrayBuffer>>({
            write(chunk) {
                return streamWriter.write(chunk);
            },
            close() {
                return settleWriter('close');
            },
            abort(reason) {
                return settleWriter('abort', reason);
            },
        }),
        finalize: async () => {
            await settleWriter('close');
            await savePromise;
        },
        abort: async (reason?: unknown) => {
            if (saveCompletedSuccessfully || abortTriggered) {
                return;
            }
            abortTriggered = true;
            await settleWriter('abort', reason);
            const streamForSaver = (await streamWrapperPromise) as ReadableStream;
            const isLocked = typeof streamForSaver.locked === 'boolean' ? streamForSaver.locked : false;
            if (typeof streamForSaver.cancel === 'function' && !isLocked) {
                await streamForSaver.cancel(reason);
            }
            await savePromise.catch(() => undefined);
        },
    };
};
