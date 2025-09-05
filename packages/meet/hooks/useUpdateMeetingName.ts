import { c } from 'ttag';

import { useApi } from '@proton/components';
import { updateMeetingNameCall } from '@proton/shared/lib/api/meet';
import type { CreateMeetingResponse } from '@proton/shared/lib/interfaces/Meet';

import { encryptMeetingName } from '../utils/cryptoUtils';
import { useMeetErrorReporting } from './useMeetErrorReporting';

export const useUpdateMeetingName = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const updateMeetingName = async (meetingId: string, meetingName: string, sessionKey: Uint8Array<ArrayBuffer>) => {
        try {
            const encryptedMeetingName = await encryptMeetingName(meetingName, sessionKey);

            const { Meeting } = await api<CreateMeetingResponse>({
                ...updateMeetingNameCall(meetingId, {
                    Name: encryptedMeetingName,
                }),
            });

            return Meeting;
        } catch (error) {
            reportMeetError('Error updating meeting name', error);

            throw new Error(c('Info').t`Failed to update meeting name`);
        }
    };

    return { updateMeetingName };
};
