import { useRef } from 'react';

import { useErrorHandler } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { RECOVERY_KIT_FILE_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import { type DeferredMnemonicData } from '../../signup/interfaces';
import canUseRecoveryKitPdfDownload from './canUseRecoveryKitPdfDownload';

interface ReturnValue {
    /**
     * Download the recovery kit.
     * Will return undefined if the download is not supported.
     * You should fallback to copy functionality if this is the case.
     */
    downloadRecoveryKit?: () => Promise<void>;
    /**
     * Whether the recovery kit is being downloaded.
     */
    downloadingRecoveryKit: boolean;
}

/**
 * Exposes functions to handle recovery kit download.
 * Ensure that this is only used if `canUseRecoveryKitPdfDownload` is true.
 */
const useRecoveryKitDownload = ({
    mnemonicData,
    setApiRecoveryPhrase,
}: {
    mnemonicData: DeferredMnemonicData;
    setApiRecoveryPhrase: () => Promise<void>;
}): ReturnValue => {
    const [downloadingRecoveryKit, withLoading] = useLoading();
    const onceRef = useRef(false);
    const handleError = useErrorHandler();

    const handleDownload = async () => {
        const isFirstDownload = !onceRef.current;

        if (isFirstDownload) {
            try {
                await setApiRecoveryPhrase();
            } catch (error) {
                handleError(error);
                return;
            }

            onceRef.current = true;
        }

        downloadFile(mnemonicData.blob, RECOVERY_KIT_FILE_NAME);
    };

    if (!canUseRecoveryKitPdfDownload()) {
        /**
         * Recovery kit download not supported.
         * Use the copy recovery phrase components instead.
         */
        return {
            downloadRecoveryKit: undefined,
            downloadingRecoveryKit: false,
        };
    }

    return {
        downloadRecoveryKit: () => withLoading(handleDownload),
        downloadingRecoveryKit,
    };
};

export default useRecoveryKitDownload;
