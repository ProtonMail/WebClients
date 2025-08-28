import { useCallback } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/components';

import type { CreateMeetingResponse } from '../types/response-types';
import { encryptMeetingName } from '../utils/cryptoUtils';
import { useMeetErrorReporting } from './useMeetErrorReporting';

const updateMeetingNameCall = (meetingId: string) => {
    return {
        method: 'put',
        url: `meet/v1/meetings/${meetingId}/name`,
        silence: true,
    };
};

export const useUpdateMeetingName = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const updateMeetingName = useCallback(
        async (meetingId: string, meetingName: string, sessionKey: Uint8Array<ArrayBuffer>) => {
            try {
                const encryptedMeetingName = await encryptMeetingName(meetingName, sessionKey);

                const { Meeting } = await api<CreateMeetingResponse>({
                    ...updateMeetingNameCall(meetingId),
                    data: {
                        Name: encryptedMeetingName,
                    },
                });

                return Meeting;
            } catch (error) {
                reportMeetError('Error updating meeting name', error);

                throw new Error(c('meet_2025 Info').t`Failed to update meeting name`);
            }
        },
        [api]
    );

    return { updateMeetingName };
};
