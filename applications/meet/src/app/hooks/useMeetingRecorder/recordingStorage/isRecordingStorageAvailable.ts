let availability: Promise<boolean> | undefined;

const checkRecordingStorage = async (): Promise<boolean> => {
    if (!navigator.storage?.getDirectory) {
        return false;
    }

    try {
        await navigator.storage.getDirectory();
        return true;
    } catch {
        return false;
    }
};

export const isRecordingStorageAvailable = (): Promise<boolean> => {
    availability ??= checkRecordingStorage();
    return availability;
};
