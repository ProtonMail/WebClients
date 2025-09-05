import { useApi } from '@proton/components';
import { getActiveMeetingsQuery } from '@proton/shared/lib/api/meet';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

export const useGetActiveMeetings = () => {
    const api = useApi();

    const getActiveMeetings = async () => {
        try {
            const response = await api<{ Meetings: Meeting[] }>(getActiveMeetingsQuery);

            return response.Meetings;
        } catch (error) {
            console.error(error);
        }
    };

    return { getActiveMeetings };
};
