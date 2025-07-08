import { c } from 'ttag';

import { MeetingType } from '../../response-types';
import type { CreateMeetingParams } from '../../types';
import { getMeetingLink } from '../../utils/getMeetingLink';
import { useSaveMeeting } from '../useSaveMeeting';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';

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
        startTime,
        endTime,
        recurrence,
        timeZone,
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
            };
        } catch (error) {
            throw new Error(c('l10n_nightly Error').t`Failed to create meeting`);
        }
    };

    return { createMeeting };
};
