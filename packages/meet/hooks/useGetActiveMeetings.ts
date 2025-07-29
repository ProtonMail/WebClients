import { useApi } from '@proton/components';

import type { Meeting } from '../types/response-types';

const getActiveMeetingsCall = () => {
    return {
        method: 'get',
        url: `meet/v1/meetings/active`,
        silence: true,
    };
};

export const useGetActiveMeetings = () => {
    const api = useApi();

    const getActiveMeetings = async () => {
        try {
            const response = await api<{ Meetings: Meeting[] }>(getActiveMeetingsCall());

            return response.Meetings;
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    return { getActiveMeetings };
};
