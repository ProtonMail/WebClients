import { isIos, isIpad } from '@proton/shared/lib/helpers/browser';

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

export default canUseRecoveryKitPdfDownload;
