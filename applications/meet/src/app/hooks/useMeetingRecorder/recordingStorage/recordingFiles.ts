import type { PrivateKeyReference } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';

import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';
import { isChromiumBased } from '@proton/shared/lib/helpers/browser';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

const RECORDING_FILENAME_RE = /^recording-(\d+)\.([a-z0-9]+)$/i;

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

export const listOpfsRecordings = async (userId: string): Promise<OpfsRecording[]> => {
    const directory = await getRecordingDirectory(userId);
    if (!directory) {
        return [];
    }
    return sortNewestFirst(await collectRecordings(directory, userId));
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

export const getOpfsRecording = async (userId: string, name: string): Promise<OpfsRecording | null> => {
    const directory = await getRecordingDirectory(userId);
    if (!directory) {
        return null;
    }
    const file = await (await directory.getFileHandle(name)).getFile();
    return buildRecording(name, file, userId);
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

    const file = await getRecordingFile(recording);
    // NB: reading out the stream will fail at some point if the recording was cut short; the partial output can still be used
    // since AEAD is used for encrypting the recording
    const { dataStream: decryptedStream } = await CryptoProxy.decryptMessageStream({
        binaryMessageStream: file.stream(),
        decryptionKeys,
        format: 'binary',
    });

    if (isChromiumBased() && typeof window.showSaveFilePicker === 'function') {
        const handle = await window.showSaveFilePicker({ suggestedName: fileName });
        const writable = await handle.createWritable();

        try {
            let decryptedBytes = 0;
            const isFullRecording = await decryptedStream
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
                })
                .then(() => true)
                .catch(async (err) => {
                    if (decryptedBytes === 0) {
                        // decryption error is likely not due to recording truncation;
                        // also, no data for the user to download anyway
                        throw err;
                    }
                    // because of `preventAbort: true`, we need to manually close the writable here
                    await writable.close();
                    return false;
                });

            return isFullRecording;

            // TODO? notify user in case of isFullRecording === false?
        } catch (error) {
            await writable.abort(error).catch(() => {});
            throw error;
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
        const decryptedChunks = [];

        while (true) {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    return { isFullRecording: true, data: mergeUint8Arrays(decryptedChunks) };
                }

                decryptedChunks.push(value);
            } catch (e) {
                if (decryptedChunks.length > 0) {
                    return { isFullRecording: false, data: mergeUint8Arrays(decryptedChunks) };
                }

                throw e;
            }
        }
    };

    // TODO update type with actual one based on codec!!!!
    const decryptedRecording = await readToEndOrPartiallyDecrypted(
        decryptedStream as ReadableStream /* TS issue due to Node types shadowing DOM ones */
    );

    const url = URL.createObjectURL(new Blob([decryptedRecording.data], { type: 'application/octect' }));
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
