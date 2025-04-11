import type { Runtime } from 'webextension-polyfill';

import type { FileBuffer } from '@proton/pass/lib/file-storage/types';
import { WorkerMessageType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { createMockChunk, createMockErrorStream, createMockReadableStream } from './testing';
import { base64ToBlob, base64ToFile, blobToBase64, portTransferWriter } from './utils';

const self = global as any;

const SAMPLE_TXT = uniqueId(32);
const SAMPLE_B64 = btoa(SAMPLE_TXT);

describe('file-storage/utils', () => {
    beforeEach(() => {
        self.EXTENSION_BUILD = false;
    });

    describe('blobToBase64', () => {
        test('converts blob to base64', async () => {
            const blob = new Blob([SAMPLE_TXT], { type: 'text/plain' });
            const result = await blobToBase64(blob);
            const resultBlob = base64ToBlob(result);
            const text = await resultBlob.text();

            expect(text).toBe(SAMPLE_TXT);
        });
    });

    describe('base64ToBlob', () => {
        test('converts base64 to blob', async () => {
            const result = base64ToBlob(SAMPLE_B64);
            const text = await result.text();

            expect(result).toBeInstanceOf(Blob);
            expect(text).toBe(SAMPLE_TXT);
        });
    });

    describe('base64ToFile', () => {
        test('converts base64 to file with correct props', async () => {
            const filename = 'test.txt';
            const mimeType = 'text/plain';
            const result = base64ToFile(SAMPLE_B64, filename, mimeType);
            const text = await result.text();

            expect(result).toBeInstanceOf(File);
            expect(result.name).toBe(filename);
            expect(result.type).toBe(mimeType);
            expect(text).toBe(SAMPLE_TXT);
        });
    });

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
