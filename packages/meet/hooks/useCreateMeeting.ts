import { c } from 'ttag';

import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import type { CreateMeetingParams } from '../types/types';
import { getMeetingLink } from '../utils/getMeetingLink';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';
import { useSaveMeeting } from './useSaveMeeting';

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
        protonCalendar = false,
    }: CreateMeetingParams) => {
        const { privateKey, addressId } = await getMeetingDependencies();

        try {
            const { response, passwordBase } = await saveMeeting({
                params: { customPassword, protonCalendar, meetingName, startTime, endTime, recurrence, timeZone, type },
                privateKey,
                addressId,
            });

            return {
                meetingLink: getMeetingLink(response.Meeting.MeetingLinkName, passwordBase),
                id: response.Meeting.MeetingLinkName,
                meeting: response.Meeting,
            };
        } catch (error) {
            throw new Error(c('Error').t`Failed to create meeting`);
        }
    };

    return { createMeeting };
};
