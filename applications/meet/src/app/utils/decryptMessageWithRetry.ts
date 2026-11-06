import { logger } from '@protontech/logger';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { DecryptedMessageInfoData, MeetCoreClient } from '../wasm/MeetCoreClient';

const DECRYPT_RETRY_DELAYS_MS = [0, 2_000, 4_000];

// The MLS group state can lag behind the first packets after a join or an epoch change.
export const decryptMessageWithRetry = async ({
    meetCoreClient,
    encryptedData,
    reportMeetError,
    failureLabel,
    isSuperseded = () => false,
}: {
    meetCoreClient: MeetCoreClient;
    encryptedData: Parameters<MeetCoreClient['decryptMessage']>[0];
    reportMeetError: ReportMeetError;
    failureLabel: string;
    isSuperseded?: () => boolean;
}): Promise<DecryptedMessageInfoData | undefined> => {
    let hasThrown = false;

    for (let attempt = 1; attempt <= DECRYPT_RETRY_DELAYS_MS.length; attempt++) {
        const delay = DECRYPT_RETRY_DELAYS_MS[attempt - 1];
        if (delay > 0) {
            await wait(delay);
        }

        try {
            const result = await meetCoreClient.decryptMessage(encryptedData);
            if (result) {
                return result;
            }
        } catch (error) {
            hasThrown = true;
            if (attempt < DECRYPT_RETRY_DELAYS_MS.length) {
                logger.info(`${failureLabel}, retrying`, { attempt, error });
            }
        }
    }

    if (!hasThrown) {
        return undefined;
    }

    if (isSuperseded()) {
        logger.info(`${failureLabel}, superseded by a later message`);
        return undefined;
    }

    reportMeetError(failureLabel, { level: 'error' });
    return undefined;
};
