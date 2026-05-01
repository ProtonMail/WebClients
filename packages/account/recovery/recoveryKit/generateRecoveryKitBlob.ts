import { format } from 'date-fns';

import { traceError } from '@proton/shared/lib/helpers/sentry';
import { dateLocale } from '@proton/shared/lib/i18n';

import { getRecoveryKit } from './getRecoveryKit';

export type RecoveryKitBlob = Blob;

/**
 * Speed up usage by prefetching the recovery kit generation with usePrefetchGenerateRecoveryKit
 */
export const generateRecoveryKitBlob = async ({
    recoveryPhrase,
    emailAddress,
}: {
    recoveryPhrase: string;
    emailAddress: string;
}): Promise<RecoveryKitBlob | null> => {
    try {
        const { generatePDFKit } = await getRecoveryKit();

        const pdf = await generatePDFKit({
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
