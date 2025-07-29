import { c } from 'ttag';

import type { CreateMeetingParams } from '../types/response-types';
import { MeetingType } from '../types/response-types';
import { getMeetingLink } from '../utils/getMeetingLink';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';
import { useSaveMeeting } from './useSaveMeeting';

export const createMeetingCall = () => {
    return {
        method: 'post',
        url: 'meet/v1/meetings',
        silence: true,
    };
};

export const useCreateMeeting = () => {
    const saveMeeting = useSaveMeeting();

    const getMeetingDependencies = useGetMeetingDependencies();

    const createMeeting = async ({
        meetingName,
        startTime = null,
        endTime = null,
        recurrence = null,
        timeZone = null,
        customPassword = '',
        type = MeetingType.INSTANT,
    }: CreateMeetingParams) => {
        const { privateKey, addressId } = await getMeetingDependencies();

        try {
            const { response, passwordBase } = await saveMeeting({
                params: { customPassword, meetingName, startTime, endTime, recurrence, timeZone, type },
                privateKey,
                addressId,
            });

            return {
                meetingLink: getMeetingLink(response.Meeting.MeetingLinkName, passwordBase),
                id: response.Meeting.MeetingLinkName,
                meeting: response.Meeting,
            };
        } catch (error) {
            throw new Error(c('l10n_nightly Error').t`Failed to create meeting`);
        }
    };

    return { createMeeting };
};
