import { useCallback } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/components';

import type { CreateMeetingResponse } from '../types/response-types';
import { encryptMeetingName } from '../utils/cryptoUtils';

const updateMeetingNameCall = (meetingId: string) => {
    return {
        method: 'put',
        url: `meet/v1/meetings/${meetingId}/name`,
        silence: true,
    };
};

export const useUpdateMeetingName = () => {
    const api = useApi();

    const updateMeetingName = useCallback(
        async (meetingId: string, meetingName: string, sessionKey: Uint8Array) => {
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
                throw new Error(c('l10n_nightly Info').t`Failed to update meeting name`);
            }
        },
        [api]
    );

    return { updateMeetingName };
};
