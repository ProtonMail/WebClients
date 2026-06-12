export const RECORDING_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Matches `recording-<timestamp>.<ext>` as written by the storage worker.
const RECORDING_FILENAME_RE = /^recording-(\d+)\./;

export const purgeOldRecordings = async (maxAgeMs: number): Promise<void> => {
    let fileSystemDirectoryHandle: FileSystemDirectoryHandle;
    try {
        fileSystemDirectoryHandle = await navigator.storage.getDirectory();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Purge old recordings: Failed to get storage directory', error);
        return;
    }

    const entries = fileSystemDirectoryHandle.entries();

    if (!entries) {
        return;
    }

    const cutoff = Date.now() - maxAgeMs;

    try {
        for await (const [name, handle] of entries) {
            if (handle.kind !== 'file') {
                continue;
            }

            const match = name.match(RECORDING_FILENAME_RE);
            if (!match) {
                continue;
            }

            const timestamp = Number(match[1]);
            if (!Number.isFinite(timestamp) || timestamp > cutoff) {
                continue;
            }

            try {
                await fileSystemDirectoryHandle.removeEntry(name);
            } catch (error) {
                // File may be locked by an active recording in another tab — skip.
                // eslint-disable-next-line no-console
                console.error('Purge old recordings: Failed to remove recording file', error);
            }
        }
    } catch (error) {
        // Iteration failed (eviction, quota error). Best-effort: don't block boot.
        // eslint-disable-next-line no-console
        console.error('Purge old recordings: Failed to purge recordings', error);
    }
};
