import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';
import { isChromiumBased } from '@proton/shared/lib/helpers/browser';

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

export const downloadOpfsRecording = async (recording: OpfsRecording): Promise<void> => {
    const isoDate = new Date(recording.createdAt).toISOString().replace(/[:.]/g, '-');
    const fileName = `meeting-recording-${isoDate}.${recording.extension}`;

    if (isChromiumBased() && typeof window.showSaveFilePicker === 'function') {
        const handle = await window.showSaveFilePicker({ suggestedName: fileName });
        const writable = await handle.createWritable();
        try {
            const file = await getRecordingFile(recording);
            await file.stream().pipeTo(writable);
        } catch (error) {
            await writable.abort(error).catch(() => {});
            throw error;
        }
        return;
    }

    const file = await getRecordingFile(recording);
    const url = URL.createObjectURL(file);
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
};
