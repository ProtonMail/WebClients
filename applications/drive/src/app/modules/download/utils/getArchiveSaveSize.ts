import { MEMORY_DOWNLOAD_LIMIT } from '@proton/shared/lib/drive/constants';

// The size picks the save mechanism and becomes Content-Length --> on iOS, encrypted size only for in-memory saves.
export const getArchiveSaveSize = ({
    archiveLength,
    totalEncryptedSize,
    isIos,
}: {
    archiveLength: number | undefined;
    totalEncryptedSize: number;
    isIos: boolean;
}): number | undefined => {
    if (archiveLength !== undefined) {
        return archiveLength;
    }
    if (totalEncryptedSize === 0) {
        return undefined;
    }
    if (isIos && totalEncryptedSize >= MEMORY_DOWNLOAD_LIMIT) {
        return undefined;
    }
    return totalEncryptedSize;
};
