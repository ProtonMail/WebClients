import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import {
    createMockChunk,
    createMockErrorStream,
    createMockReadableStream,
} from '@proton/pass/lib/file-storage/testing';
import type { FileBuffer } from '@proton/pass/lib/file-storage/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { portTransferWriter } from './fs.utils';

describe('file-storage/utils', () => {
    describe('portTransferWriter', () => {
        const fileRef = 'test.txt';
        const chunks = [createMockChunk(), createMockChunk()];
        const port = { postMessage: jest.fn() } as unknown as Runtime.Port;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('sends data via port when the writer receives chunks', async () => {
            const { signal } = new AbortController();
            const stream = createMockReadableStream(chunks);

            await portTransferWriter(fileRef, stream, signal, port);

            expect(port.postMessage).toHaveBeenCalledWith({
                type: WorkerMessageType.FS_WRITE,
                payload: {
                    fileRef,
                    b64: uint8ArrayToBase64String(chunks[0]),
                },
            });
        });

        test('handles errors by sending error message', async () => {
            const { signal } = new AbortController();
            const stream = createMockErrorStream<FileBuffer>();
            await expect(portTransferWriter(fileRef, stream, signal, port)).rejects.toThrow();

            expect(port.postMessage).toHaveBeenCalledWith({
                payload: { fileRef },
                type: WorkerMessageType.FS_ERROR,
            });
        });

        test('aborts transfer when signal is aborted', async () => {
            const ctrl = new AbortController();
            const { signal } = ctrl;

            const stream = createMockReadableStream([new Uint8Array([42])], 100);
            const transfer = portTransferWriter(fileRef, stream, signal, port);

            ctrl.abort();
            await expect(transfer).rejects.toThrow();

            expect(port.postMessage).toHaveBeenCalledWith({
                payload: { fileRef },
                type: WorkerMessageType.FS_ERROR,
            });
        });

        test('throws if port is not found', () => {
            const { signal } = new AbortController();
            const stream = createMockReadableStream(chunks);
            expect(() => portTransferWriter(fileRef, stream, signal, undefined)).toThrow();
        });
    });
});
