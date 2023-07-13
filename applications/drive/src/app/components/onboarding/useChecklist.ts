import { useEffect, useState } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';

import { useApi, useUser } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getDriveChecklist, seenCompletedDriveChecklist } from '@proton/shared/lib/api/checklist';
import { ChecklistApiResponse } from '@proton/shared/lib/interfaces';

export default function useChecklist() {
    const api = useApi();
    const [user] = useUser();
    const [isLoading, withLoading] = useLoading(false);
    const [checklist, setChecklist] = useState<ChecklistApiResponse>();

    useEffect(() => {
        if (user.isPaid) {
            return;
        }
        withLoading(api<ChecklistApiResponse>(getDriveChecklist('get-started')).then(setChecklist)).catch(
            console.error
        );
    }, []);

    const reload = () => {
        api<ChecklistApiResponse>(getDriveChecklist('get-started')).then(setChecklist).catch(console.error);
    };

    const expiresInDays = checklist?.ExpiresAt ? differenceInDays(fromUnixTime(checklist.ExpiresAt), new Date()) : 0;

    // If dismiss is set to true, then the checklist disappears completely.
    // If set to false, it just marks seen on backend but keeps it on web for the session.
    const markCompletedAsSeen = (dismiss: boolean = true) => {
        if (dismiss) {
            setChecklist(undefined);
        }
        void api<ChecklistApiResponse>(seenCompletedDriveChecklist('get-started'));
    };

    return {
        isLoading,
        completedActions: checklist?.Items || [],
        isCompleted: checklist ? checklist.UserWasRewarded : true,
        isVisible: checklist?.Visible || false,
        expiresInDays,
        reload,
        markCompletedAsSeen,
    };
}
