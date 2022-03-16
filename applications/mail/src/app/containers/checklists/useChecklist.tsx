import { useApi, useEventManager, useLoading, useUserSettings } from '@proton/components';
import { getChecklist } from '@proton/shared/lib/api/checklist';
import { ChecklistId, ChecklistKey } from '@proton/shared/lib/interfaces';
import { useEffect, useState } from 'react';

import { Event } from '../../models/event';

interface ChecklistApiResponse {
    Items: ChecklistKey[];
    CreatedAt: number;
}

const useChecklist = (id: ChecklistId) => {
    const [checklist, setChecklist] = useState<ChecklistApiResponse>({
        Items: [],
        CreatedAt: 0,
    });

    const [userSettings] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const { subscribe } = useEventManager();
    const api = useApi();

    useEffect(() => {
        if (userSettings.Checklists?.includes(id)) {
            void withLoading(api<{ Items: ChecklistKey[]; CreatedAt: number }>(getChecklist(id)).then(setChecklist));
        }

        const unsubscribe = subscribe(({ Checklist }: Event) => {
            Checklist?.forEach(({ CompletedItem }) => {
                setChecklist((current) => ({
                    ...current,
                    Items: [...current.Items, CompletedItem],
                }));
            });
        });

        return () => {
            unsubscribe();
        };
    }, [userSettings]);

    return [checklist, loading] as const;
};

export default useChecklist;
