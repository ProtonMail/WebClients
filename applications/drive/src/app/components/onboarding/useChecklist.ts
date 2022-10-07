import { useEffect, useState } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';

import { useApi, useLoading, useUser } from '@proton/components';
import { getDriveChecklist, seenCompletedDriveChecklist } from '@proton/shared/lib/api/checklist';
import { ChecklistApiResponse } from '@proton/shared/lib/interfaces';

export default function useChecklist() {
    const api = useApi();
    const [user] = useUser();
    const [isLoading, withLoading] = useLoading(false);
    const [checklist, setChecklist] = useState<ChecklistApiResponse>();

    useEffect(() => {
        if (!user.isFree) {
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

    const markCompletedAsSeen = () => {
        setChecklist(undefined);
        api<ChecklistApiResponse>(seenCompletedDriveChecklist('get-started'));
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
