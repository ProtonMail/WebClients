import { useEffect, useState } from 'react';

import { useApi, useLoading } from '@proton/components/hooks';
import { getAllInvitations } from '@proton/shared/lib/api/calendars';
import { CalendarMemberInvitation } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

const useCalendarShareInvitations = () => {
    const api = useApi();

    const [invitations, setInvitations] = useState<CalendarMemberInvitation[]>([]);
    const [loading, withLoading] = useLoading(true);

    useEffect(() => {
        const run = async () => {
            try {
                const { Invitations } = await api<{ Invitations: CalendarMemberInvitation[] }>(getAllInvitations());

                setInvitations(Invitations);
            } catch {
                // we simply let the API growl
                noop();
            }
        };
        void withLoading(run());
    }, []);

    return { invitations, loading };
};

export default useCalendarShareInvitations;
