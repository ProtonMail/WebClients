import { useRef } from 'react';
import { useLayoutEffect } from 'react';

import { format } from 'date-fns';

import { useErrorHandler } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { RECOVERY_KIT_FILE_NAME } from '@proton/shared/lib/constants';
import { isIos, isIpad } from '@proton/shared/lib/helpers/browser';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import { dateLocale } from '@proton/shared/lib/i18n';

import type { RecoveryKitBlob } from './types';

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

let ranPreload = false;

export const getRecoveryKit = async () => {
    // Note: This chunkName is important as it's used in the chunk plugin to avoid splitting it into multiple files
    return import(/* webpackChunkName: "recovery-kit" */ '@proton/recovery-kit');
};

/**
 * Prefetch @proton/recovery-kit
 * To be called before useRecoveryKitDownload to speed up recovery kit generation
 */
export const usePrefetchGenerateRecoveryKit = () => {
    useLayoutEffect(() => {
        if (ranPreload) {
            return;
        }

        ranPreload = true;

        setTimeout(() => {
            /* Custom preload */
            getRecoveryKit()
                .then((result) => {
                    document.body.append(...result.getPrefetch());
                })
                .catch((e) => {
                    traceError(e);
                });
        }, 0);
    }, []);
};

export const generateRecoveryKitBlob = async ({
    recoveryPhrase,
    emailAddress,
}: {
    recoveryPhrase: string;
    emailAddress: string;
}): Promise<RecoveryKitBlob | null> => {
    try {
        const generatePDFRecoveryKit = await getRecoveryKit().then((result) => result.generatePDFKit);

        const pdf = await generatePDFRecoveryKit({
            // Not translated because the PDF isn't translated
            date: `Created on ${format(new Date(), 'PPP', { locale: dateLocale })}`,
            emailAddress,
            recoveryPhrase,
        });

        const blob = new Blob([pdf.buffer], { type: 'application/pdf' });

        return blob;
    } catch (error) {
        traceError(error);
        return null;
    }
};

interface ReturnValueBase {
    /**
     * Whether the download is supported.
     * You should fallback to copy functionality if download is not supported.
     */
    canDownloadRecoveryKit: boolean;
    /**
     * Download the recovery kit.
     * Will return null if the download is not supported.
     */
    downloadRecoveryKit: (() => Promise<void>) | null;
    /**
     * Whether the recovery kit is being downloaded.
     */
    downloadingRecoveryKit: boolean;
    /**
     * Blob of the pdf that will be downloaded.
     * Will be null if the download is not supported.
     */
    recoveryKitBlobToDownload: RecoveryKitBlob | null;
}

interface ReturnValueUnsupported extends ReturnValueBase {
    canDownloadRecoveryKit: false;
    downloadRecoveryKit: null;
    downloadingRecoveryKit: false;
    recoveryKitBlobToDownload: null;
}

interface ReturnValueSupported extends ReturnValueBase {
    canDownloadRecoveryKit: true;
    downloadRecoveryKit: () => Promise<void>;
    downloadingRecoveryKit: boolean;
    recoveryKitBlobToDownload: RecoveryKitBlob;
}

type ReturnValue = ReturnValueUnsupported | ReturnValueSupported;

/**
 * Exposes functions to handle recovery kit download.
 * Use `usePrefetchGenerateRecoveryKit` to speed up the recovery kit generation.
 */
const useRecoveryKitDownload = ({
    recoveryKitBlob,
    setApiRecoveryPhrase,
}: {
    /**
     * Blob of the pdf that will be downloaded.
     * Null if an error occured while generating.
     */
    recoveryKitBlob: RecoveryKitBlob | null;
    setApiRecoveryPhrase: () => Promise<void>;
}): ReturnValue => {
    const [downloadingRecoveryKit, withLoading] = useLoading();
    const onceRef = useRef(false);
    const handleError = useErrorHandler();

    if (!recoveryKitBlob || !canUseRecoveryKitPdfDownload()) {
        /**
         * Recovery kit download not supported.
         * Use the copy recovery phrase components instead.
         */
        return {
            canDownloadRecoveryKit: false,
            downloadRecoveryKit: null,
            downloadingRecoveryKit: false,
            recoveryKitBlobToDownload: null,
        };
    }

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

        downloadFile(recoveryKitBlob, RECOVERY_KIT_FILE_NAME);
    };

    return {
        canDownloadRecoveryKit: true,
        downloadRecoveryKit: () => withLoading(handleDownload),
        downloadingRecoveryKit,
        recoveryKitBlobToDownload: recoveryKitBlob,
    };
};

export default useRecoveryKitDownload;
