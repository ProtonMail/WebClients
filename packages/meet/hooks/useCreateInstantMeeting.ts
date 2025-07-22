import { useCallback } from 'react';

import type { CreateMeetingParams } from '../types/response-types';
import { MeetingType } from '../types/response-types';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';
import { useSaveMeeting } from './useSaveMeeting';

export const useCreateInstantMeeting = () => {
    const saveMeeting = useSaveMeeting();

    const getMeetingDependencies = useGetMeetingDependencies();

    const createInstantMeeting = useCallback(
        async ({ params, isGuest = false }: { params: Partial<CreateMeetingParams>; isGuest?: boolean }) => {
            let addressId = null;
            let privateKey;

            if (!isGuest) {
                const { privateKey: privateKeyDependency, addressId: addressIdDependency } =
                    await getMeetingDependencies();

                privateKey = privateKeyDependency;

                addressId = addressIdDependency;
            }

            const { response, passwordBase } = await saveMeeting({
                params: {
                    ...params,
                    meetingName: 'Secure meeting',
                    customPassword: '',
                    startTime: null,
                    endTime: null,
                    recurrence: null,
                    timeZone: null,
                    type: MeetingType.INSTANT,
                } as CreateMeetingParams,
                noPasswordSave: isGuest,
                addressId,
                privateKey,
            });

            return {
                meetingLink: `/join/${response.Meeting.MeetingLinkName}#${passwordBase}`,
                id: response.Meeting.MeetingLinkName,
                passwordBase,
            };
        },
        [saveMeeting]
    );

    return createInstantMeeting;
};
