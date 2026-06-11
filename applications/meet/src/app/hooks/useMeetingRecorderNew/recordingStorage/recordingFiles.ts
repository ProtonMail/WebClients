const RECORDING_FILENAME_RE = /^recording-(\d+)\.([a-z0-9]+)$/i;

export interface OpfsRecording {
    name: string;
    extension: string;
    createdAt: number;
    size: number;
}

export const listOpfsRecordings = async (): Promise<OpfsRecording[]> => {
    if (!navigator.storage?.getDirectory) {
        return [];
    }

    let directory: FileSystemDirectoryHandle;
    try {
        directory = await navigator.storage.getDirectory();
    } catch {
        // No directory yet for this user means there are no recordings.
        return [];
    }
    const recordings: OpfsRecording[] = [];

    for await (const [name, handle] of directory.entries()) {
        if (handle.kind !== 'file') {
            continue;
        }

        const match = name.match(RECORDING_FILENAME_RE);
        if (!match) {
            continue;
        }

        const file = await handle.getFile();
        const timestamp = Number(match[1]);

        recordings.push({
            name,
            extension: match[2].toLowerCase(),
            createdAt: Number.isFinite(timestamp) ? timestamp : file.lastModified,
            size: file.size,
        });
    }

    // Newest first.
    recordings.sort((a, b) => b.createdAt - a.createdAt);
    return recordings;
};

export const deleteOpfsRecording = async (name: string): Promise<void> => {
    const directory = await navigator.storage.getDirectory();
    await directory.removeEntry(name);
};

export const downloadOpfsRecording = async (recording: OpfsRecording): Promise<void> => {
    const directory = await navigator.storage.getDirectory();
    const handle = await directory.getFileHandle(recording.name);
    const file = await handle.getFile();

    // The File is backed by OPFS (disk), so the browser streams it to the
    // download without materializing the whole recording in memory.
    const url = URL.createObjectURL(file);
    try {
        const isoDate = new Date(recording.createdAt).toISOString().replace(/[:.]/g, '-');
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-recording-${isoDate}.${recording.extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } finally {
        // Give the browser time to start the transfer before revoking.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
};
