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
}: {
    meetCoreClient: MeetCoreClient;
    encryptedData: Parameters<MeetCoreClient['decryptMessage']>[0];
    reportMeetError: ReportMeetError;
    failureLabel: string;
}): Promise<DecryptedMessageInfoData | undefined> => {
    for (const delay of DECRYPT_RETRY_DELAYS_MS) {
        if (delay > 0) {
            await wait(delay);
        }

        try {
            const result = await meetCoreClient.decryptMessage(encryptedData);
            if (result) {
                return result;
            }
        } catch {
            reportMeetError(failureLabel, { level: 'error' });
        }
    }

    return undefined;
};
