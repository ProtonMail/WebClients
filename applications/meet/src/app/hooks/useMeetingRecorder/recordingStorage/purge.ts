export const RECORDING_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 7 days

// Matches `recording-<timestamp>.<ext>` as written by the storage worker.
const RECORDING_FILENAME_RE = /^recording-(\d+)\./;

// Removes expired `recording-*` files directly under the given directory.
const purgeRecordingsInDirectory = async (directory: FileSystemDirectoryHandle, cutoff: number): Promise<void> => {
    for await (const [name, handle] of directory.entries()) {
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
            await directory.removeEntry(name);
        } catch (error) {
            // File may be locked by an active recording in another tab — skip.
            // eslint-disable-next-line no-console
            console.error('Purge old recordings: Failed to remove recording file', error);
        }
    }
};

export const purgeOldRecordings = async (maxAgeMs: number): Promise<void> => {
    let root: FileSystemDirectoryHandle;
    try {
        root = await navigator.storage.getDirectory();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Purge old recordings: Failed to get storage directory', error);
        return;
    }

    const cutoff = Date.now() - maxAgeMs;

    try {
        const subdirectories: FileSystemDirectoryHandle[] = [];
        let hasRootLevelRecording = false;

        for await (const [name, handle] of root.entries()) {
            if (handle.kind === 'directory') {
                // Recordings live under a per-user subdirectory.
                subdirectories.push(handle);
            } else if (RECORDING_FILENAME_RE.test(name)) {
                // Legacy recordings written directly at the OPFS root.
                hasRootLevelRecording = true;
            }
        }

        if (hasRootLevelRecording) {
            await purgeRecordingsInDirectory(root, cutoff);
        }

        for (const directory of subdirectories) {
            await purgeRecordingsInDirectory(directory, cutoff);
        }
    } catch (error) {
        // Iteration failed (eviction, quota error). Best-effort: don't block boot.
        // eslint-disable-next-line no-console
        console.error('Purge old recordings: Failed to purge recordings', error);
    }
};

// Removes ALL recordings for a single user (their whole OPFS subdirectory).
export const purgeUserRecordings = async (userId: string): Promise<void> => {
    if (!userId || !navigator.storage?.getDirectory) {
        return;
    }
    try {
        const root = await navigator.storage.getDirectory();
        await root.removeEntry(userId, { recursive: true });
    } catch {
        // No directory for this user (nothing recorded) — nothing to purge.
    }
};
