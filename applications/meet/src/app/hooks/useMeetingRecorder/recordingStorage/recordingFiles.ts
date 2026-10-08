import type { PrivateKeyReference } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';

import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';
import { isChromiumBased } from '@proton/shared/lib/helpers/browser';

import { isServiceWorkerDownloadSupported, openDownloadStream } from './download/client';
import { getRecordingFolder, isEncryptedRecordingFolder } from './getRecordingFolder';

const RECORDING_FILENAME_RE = /^recording-(\d+)\.([a-z0-9]+)$/i;

const RECORDING_MIME_TYPES: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
};

const getRecordingDirectory = async (folder?: string, create = false): Promise<FileSystemDirectoryHandle | null> => {
    if (!navigator.storage?.getDirectory) {
        return null;
    }
    try {
        const root = await navigator.storage.getDirectory();
        return folder ? await root.getDirectoryHandle(folder, { create }) : root;
    } catch {
        return null;
    }
};

const buildRecording = (name: string, file: File, folder?: string): OpfsRecording | null => {
    const match = name.match(RECORDING_FILENAME_RE);
    if (!match) {
        return null;
    }
    const timestamp = Number(match[1]);
    return {
        name,
        extension: match[2].toLowerCase(),
        createdAt: Number.isFinite(timestamp) ? timestamp : file.lastModified,
        size: file.size,
        folder,
    };
};

const collectRecordings = async (directory: FileSystemDirectoryHandle, folder?: string): Promise<OpfsRecording[]> => {
    const recordings: OpfsRecording[] = [];
    for await (const [name, handle] of directory.entries()) {
        if (handle.kind !== 'file') {
            continue;
        }
        const recording = buildRecording(name, await handle.getFile(), folder);
        if (recording) {
            recordings.push(recording);
        }
    }
    return recordings;
};

const sortNewestFirst = (recordings: OpfsRecording[]): OpfsRecording[] =>
    recordings.sort((a, b) => b.createdAt - a.createdAt);

// Reads both the encrypted and the unencrypted folder, so every recording stays downloadable
// regardless of whether MeetRecordingEncryption was on when it was taken.
export const listOpfsRecordings = async (userId: string): Promise<OpfsRecording[]> => {
    const recordings = await Promise.all(
        [getRecordingFolder(userId), userId].map(async (folder) => {
            const directory = await getRecordingDirectory(folder);
            return directory ? collectRecordings(directory, folder) : [];
        })
    );

    return sortNewestFirst(recordings.flat());
};

// Lists every recording on the device: root-level legacy files plus one level of
// per-user subdirectories. Used behind a flag to recover pre-migration recordings.
export const listAllOpfsRecordings = async (): Promise<OpfsRecording[]> => {
    if (!navigator.storage?.getDirectory) {
        return [];
    }
    let root: FileSystemDirectoryHandle;
    try {
        root = await navigator.storage.getDirectory();
    } catch {
        return [];
    }

    const recordings: OpfsRecording[] = [];
    for await (const [name, handle] of root.entries()) {
        if (handle.kind === 'file') {
            const recording = buildRecording(name, await handle.getFile());
            if (recording) {
                recordings.push(recording);
            }
        } else {
            recordings.push(...(await collectRecordings(handle, name)));
        }
    }
    return sortNewestFirst(recordings);
};

export const getOpfsRecording = async (folder: string, name: string): Promise<OpfsRecording | null> => {
    const directory = await getRecordingDirectory(folder);
    if (!directory) {
        return null;
    }
    const file = await (await directory.getFileHandle(name)).getFile();
    return buildRecording(name, file, folder);
};

export const deleteOpfsRecording = async (recording: OpfsRecording): Promise<void> => {
    const directory = await getRecordingDirectory(recording.folder);
    await directory?.removeEntry(recording.name);
};

const getRecordingFile = async (recording: OpfsRecording): Promise<File> => {
    const directory = await getRecordingDirectory(recording.folder);
    if (!directory) {
        throw new Error('Recording directory not found');
    }
    return (await directory.getFileHandle(recording.name)).getFile();
};

// `showSaveFilePicker` rejects with an AbortError when the user dismisses the save dialog.
export const isDownloadAborted = (error: unknown): boolean =>
    error instanceof DOMException && error.name === 'AbortError';

const writeDecryptedStream = async (
    decryptedStream: ReadableStream<Uint8Array<ArrayBuffer>>,
    writable: WritableStream<Uint8Array<ArrayBuffer>>,
    signal?: AbortSignal
): Promise<boolean> => {
    let decryptedBytes = 0;

    try {
        return await decryptedStream
            // this pipeThrough is needed to detect whether any data was decrypted and written,
            // in case decryptedStream throws.
            // We want the default `preventAbort: false` here since errors in decryptedStream should
            // abort this TransformStream, and propagate to the `pipeTo` .
            .pipeThrough(
                new TransformStream<Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>({
                    transform(chunk, controller) {
                        decryptedBytes += chunk.length;
                        controller.enqueue(chunk);
                    },
                })
            )
            .pipeTo(writable, {
                /**
                 * we want decryption errors to not abort the writable, since already decrypted chunks
                 * should still be downloaded
                 */
                preventAbort: true,
                signal,
            })
            .then(() => true)
            .catch(async (error) => {
                if (isDownloadAborted(error)) {
                    throw error;
                }

                if (decryptedBytes === 0) {
                    // decryption error is likely not due to recording truncation;
                    // also, no data for the user to download anyway
                    throw error;
                }

                // because of `preventAbort: true`, we need to manually close the writable here
                await writable.close();
                return false;
            });
    } catch (error) {
        await writable.abort(error).catch(() => {});
        throw error;
    }
};

const getRecordingStream = async (
    recording: OpfsRecording,
    decryptionKeys: PrivateKeyReference[]
): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> => {
    const file = await getRecordingFile(recording);

    if (!isEncryptedRecordingFolder(recording.folder)) {
        return file.stream();
    }

    // NB: reading out the stream will fail at some point if the recording was cut short; the partial output can still be used
    // since AEAD is used for encrypting the recording
    const { dataStream } = await CryptoProxy.decryptMessageStream({
        binaryMessageStream: file.stream(),
        decryptionKeys,
        format: 'binary',
    });

    return dataStream as ReadableStream<Uint8Array<ArrayBuffer>>; /* TS issue due to Node types shadowing DOM ones */
};

/**
 * @returns whether the recording was decrypted and downloaded in full (i.e. the original was not truncated)
 * @throws on decryption or downloading errors
 */
export const downloadOpfsRecording = async (
    recording: OpfsRecording,
    decryptionKeys: PrivateKeyReference[]
): Promise<boolean> => {
    const isoDate = new Date(recording.createdAt).toISOString().replace(/[:.]/g, '-');
    const fileName = `meeting-recording-${isoDate}.${recording.extension}`;
    const mimeType = RECORDING_MIME_TYPES[recording.extension] ?? 'application/octet-stream';

    const decryptedStream = await getRecordingStream(recording, decryptionKeys);

    if (isChromiumBased() && typeof window.showSaveFilePicker === 'function') {
        const handle = await window.showSaveFilePicker({ suggestedName: fileName, startIn: 'downloads' });
        return writeDecryptedStream(decryptedStream, await handle.createWritable());
    }

    if (isServiceWorkerDownloadSupported()) {
        const abortController = new AbortController();
        const saveStream = await openDownloadStream(
            { fileName, mimeType },
            { onCancel: () => abortController.abort() }
        ).catch((error) => {
            // eslint-disable-next-line no-console
            console.warn('[MeetingRecorder] service worker download unavailable, buffering in memory:', error);
            return null;
        });

        if (saveStream) {
            return writeDecryptedStream(decryptedStream, saveStream, abortController.signal);
        }
    }

    const readToEndOrPartiallyDecrypted = async (stream: ReadableStream<Uint8Array<ArrayBuffer>>) => {
        /**
         * Since recording data is AEAD encrypted, the released decrypted chunks are authenticated and can be returned
         * prior to and regardless of checking the final (empty) OpenPGP AEAD chunk.
         * Ignoring the final decryption error is necessary since the encrypted input might be a truncated OpenPGP message
         * due to e.g. unexpected interruption of the recording process (or max quota reached).
         * Still, the partially recording data can still be playable.
         */
        const reader = stream.getReader();
        const decryptedChunks: Uint8Array<ArrayBuffer>[] = [];

        while (true) {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    return { isFullRecording: true, data: decryptedChunks };
                }

                decryptedChunks.push(value);
            } catch (e) {
                if (decryptedChunks.length > 0) {
                    return { isFullRecording: false, data: decryptedChunks };
                }

                throw e;
            }
        }
    };

    const decryptedRecording = await readToEndOrPartiallyDecrypted(decryptedStream);

    const url = URL.createObjectURL(new Blob(decryptedRecording.data, { type: mimeType }));
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } finally {
        // Give the browser time to start the transfer before revoking.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
    return decryptedRecording.isFullRecording;
};
