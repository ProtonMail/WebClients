import type { FileTransferErrorMessage, FileTransferWriteMessage } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { FilePortWriter } from '@proton/pass/lib/file-storage/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { wait } from '@proton/shared/lib/helpers/promise';

export const portTransferWriter: FilePortWriter = (fileRef, stream, signal, port) => {
    if (!port) throw new Error('Port not found for transfer');

    const onError = () => {
        port.postMessage({
            payload: { fileRef },
            type: WorkerMessageType.FS_ERROR,
        } satisfies FileTransferErrorMessage);
    };

    const writer = new WritableStream({
        write: (chunk: Uint8Array<ArrayBuffer>) => {
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
