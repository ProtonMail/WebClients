import { useCreateMeeting } from './useCreateMeeting';
import { useDeleteMeeting } from './useDeleteMeeting';
import { useGetActiveMeetings } from './useGetActiveMeetings';
import { useGetMeeting } from './useGetMeeting';
import { useGetMeetingByLinkName } from './useGetMeetingByLinkName';
import { useMeetingUpdates } from './useMeetingUpdates';

export const useProtonMeet = () => {
    const { createMeeting } = useCreateMeeting();

    const { deleteMeeting } = useDeleteMeeting();

    const { getMeeting } = useGetMeeting();

    const { getMeetingByLinkName } = useGetMeetingByLinkName();

    const { saveMeetingPassword, saveMeetingName, saveMeetingSchedule } = useMeetingUpdates();

    const { getActiveMeetings } = useGetActiveMeetings();

    return {
        createProtonMeet: createMeeting,
        deleteProtonMeet: deleteMeeting,
        getProtonMeet: getMeeting,
        saveProtonMeetPassword: saveMeetingPassword,
        saveProtonMeetName: saveMeetingName,
        saveMeetingSchedule: saveMeetingSchedule,
        getActiveProtonMeet: getActiveMeetings,
        getProtonMeetByLinkName: getMeetingByLinkName,
    };
};
