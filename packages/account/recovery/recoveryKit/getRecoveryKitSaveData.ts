import { RECOVERY_KIT_FILE_NAME } from '@proton/shared/lib/constants';
import { isIos, isIpad } from '@proton/shared/lib/helpers/browser';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import noop from '@proton/utils/noop';

import type { RecoveryKitBlob } from './generateRecoveryKitBlob';

/**
 * If true, we can use the recovery kit pdf download.
 * If false, we need to use copy recovery phrase instead
 */
const canUseRecoveryKitPdfDownload = () => {
    /**
     * iOS and iPad have a bug where the blob download is not working.
     * We need to use the copy to clipboard method instead.
     */
    const isBrokenBlobDownload = isIos() || isIpad();

    return !isBrokenBlobDownload;
};

export interface RecoveryKitSaveReturnValue {
    /**
     * Whether the download is supported.
     * You should fallback to copy functionality if download is not supported.
     */
    canDownloadRecoveryKit: boolean;
    /**
     * Download the recovery kit.
     */
    downloadRecoveryKit: () => void;
    /**
     * Copy the recovery phrase.
     */
    copyRecoveryPhrase: () => void;
    /**
     * Helper function to download or copy phrase.
     */
    handle: (type: 'copy' | 'download') => Promise<void>;
    /**
     * Size of the pdf that will be downloaded in bytes.
     * Will be 0 if the download is not supported.
     */
    recoveryKitBytes: number;
}

/**
 * Exposes functions to handle recovery kit download.
 * Use `usePrefetchGenerateRecoveryKit` to speed up the recovery kit generation.
 */
export const getRecoveryKitSaveData = ({
    recoveryPhrase,
    recoveryKitBlob,
    isShareFeatureEnabled,
}: {
    recoveryPhrase: string;
    /**
     * Blob of the pdf that will be downloaded.
     * Null if an error occurred while generating.
     */
    recoveryKitBlob: RecoveryKitBlob | null;
    isShareFeatureEnabled: boolean;
}): RecoveryKitSaveReturnValue => {
    const canShareRecoveryKitInMobile = isShareFeatureEnabled && isIos();
    const canDownloadRecoveryKit = !!recoveryKitBlob && (canShareRecoveryKitInMobile || canUseRecoveryKitPdfDownload());

    const handleDownload = async () => {
        if (!recoveryKitBlob) {
            return;
        }

        const file = new File([recoveryKitBlob], RECOVERY_KIT_FILE_NAME, { type: 'application/pdf' });

        if (canShareRecoveryKitInMobile && navigator.canShare?.({ files: [file] })) {
            return navigator.share({ files: [file] }).catch(noop);
        }

        downloadFile(recoveryKitBlob, RECOVERY_KIT_FILE_NAME);
    };

    const handleCopy = () => {
        return navigator.clipboard.writeText(recoveryPhrase);
    };

    return {
        canDownloadRecoveryKit,
        downloadRecoveryKit: handleDownload,
        recoveryKitBytes: canDownloadRecoveryKit ? recoveryKitBlob.size : 0,
        copyRecoveryPhrase: handleCopy,
        handle: (type: 'copy' | 'download') => {
            if (type === 'copy') {
                return handleCopy();
            } else {
                return handleDownload();
            }
        },
    };
};
