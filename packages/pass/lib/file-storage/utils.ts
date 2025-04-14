import type { Runtime } from 'webextension-polyfill';

import { MemoryStorage, fileStorage } from '@proton/pass/lib/file-storage/fs';
import type { FileBuffer, FileStorage } from '@proton/pass/lib/file-storage/types';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { FileTransferWriteMessage } from '@proton/pass/types';
import { type FileTransferErrorMessage, type Maybe, WorkerMessageType } from '@proton/pass/types';
import {
    base64StringToUint8Array,
    blobToUint8Array,
    uint8ArrayToBase64String,
    uint8ArrayToBlob,
} from '@proton/shared/lib/helpers/encoding';
import { wait } from '@proton/shared/lib/helpers/promise';

export const blobToBase64 = async (blob: Blob): Promise<string> => {
    const buffer = await blobToUint8Array(blob);
    return uint8ArrayToBase64String(buffer);
};

export const base64ToBlob = (b64: string): Blob => {
    const buffer = base64StringToUint8Array(b64);
    return uint8ArrayToBlob(buffer);
};

export const base64ToFile = (b64: string, filename: string, mimeType: string): File => {
    const blob = base64ToBlob(b64);
    return new File([blob], filename, { type: mimeType });
};

export const portTransferWriter = (
    fileRef: string,
    stream: ReadableStream<FileBuffer>,
    signal: AbortSignal,
    port: Maybe<Runtime.Port>
) => {
    if (!port) throw new Error('Port not found for transfer');

    const onError = () => {
        port.postMessage({
            payload: { fileRef },
            type: WorkerMessageType.FS_ERROR,
        } satisfies FileTransferErrorMessage);
    };

    const writer = new WritableStream({
        write: (chunk: Uint8Array) => {
            port.postMessage({
                type: WorkerMessageType.FS_WRITE,
                payload: {
                    b64: uint8ArrayToBase64String(chunk),
                    fileRef,
                },
            } satisfies FileTransferWriteMessage);
        },
        abort: onError,

        close: async () => {
            await wait(500);
        },
    });

    try {
        return stream.pipeTo(writer, { signal });
    } catch (err) {
        onError();
        throw err;
    }
};

export const getSafeStorage: (storageType: string) => FileStorage = EXTENSION_BUILD
    ? (storageType) => {
          /** If the extension component has a different storage instance then
           * the service-worker's instance (eg: Firefox private browsing), always
           * fallback to base64 encoding blobs via message passing */
          if (storageType !== fileStorage.type) return MemoryStorage;
          else return fileStorage;
      }
    : () => fileStorage;

/** Creates a file writer that safely handles different storage scenarios.
 * In extension builds, this provides a fallback mechanism when using memory
 * storage by streaming file data through port messaging rather than loading
 * the entire file into memory as a blob. This prevents memory issues with
 * large files when OPFS or IDB aren't available. For non-extension builds or
 * when using other storage types, it uses the standard `FileStorage` API. */
export const getSafeWriter =
    (fs: FileStorage, options: RootSagaOptions) =>
    (filename: string, stream: ReadableStream<FileBuffer>, signal: AbortSignal, portName?: string): Promise<void> => {
        if (EXTENSION_BUILD && fs.type === 'Memory') {
            const port = options.getPort?.(portName ?? '');
            return portTransferWriter(filename, stream, signal, port);
        } else {
            return fs.writeFile(filename, stream, signal);
        }
    };
