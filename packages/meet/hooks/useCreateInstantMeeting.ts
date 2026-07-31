import { c } from 'ttag';

import { MeetingType, WaitingRoomState } from '@proton/shared/lib/interfaces/Meet';

import type { CreateMeetingParams } from '../types/types';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';
import { useSaveMeeting } from './useSaveMeeting';

export const useCreateInstantMeeting = () => {
    const saveMeeting = useSaveMeeting();

    const getMeetingDependencies = useGetMeetingDependencies();

    const createInstantMeeting = async ({
        params,
        isGuest = false,
        isPaidUser = false,
        waitingRoom = false,
    }: {
        params: Partial<CreateMeetingParams>;
        isGuest?: boolean;
        isPaidUser?: boolean;
        waitingRoom?: boolean;
    }) => {
        let addressId = null;
        let privateKey;

        if (!isGuest) {
            const { privateKey: privateKeyDependency, addressId: addressIdDependency } = await getMeetingDependencies();

            privateKey = privateKeyDependency;

            addressId = addressIdDependency;
        }

        const { response, passwordBase } = await saveMeeting({
            params: {
                ...params,
                meetingName: isPaidUser ? c('Info').t`Premium meeting` : c('Info').t`Free meeting`,
                startTime: null,
                endTime: null,
                recurrence: null,
                timeZone: null,
                type: MeetingType.INSTANT,
                waitingRoom: waitingRoom ? WaitingRoomState.ENABLED : WaitingRoomState.DISABLED,
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
    };

    return createInstantMeeting;
};
