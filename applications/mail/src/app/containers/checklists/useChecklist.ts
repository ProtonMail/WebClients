import { useEffect, useState } from 'react';

import { useApi, useEventManager, useLoading, useUserSettings } from '@proton/components';
import { getChecklist } from '@proton/shared/lib/api/checklist';
import { ChecklistId, ChecklistKey } from '@proton/shared/lib/interfaces';

import { Event } from '../../models/event';

interface ChecklistApiResponse {
    Code: number;
    Items: ChecklistKey[];
    CreatedAt: number;
    ExpiresAt: number;
}

export interface GetStartedChecklistApiResponse extends ChecklistApiResponse {
    RewardInGB: number;
}

export type Checklist = ChecklistApiResponse | GetStartedChecklistApiResponse;

const useChecklist = (id: ChecklistId) => {
    const [checklist, setChecklist] = useState<Checklist>({
        Code: 0,
        Items: [] as ChecklistKey[],
        CreatedAt: 0,
        ExpiresAt: 0,
    });

    const [userSettings] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const { subscribe } = useEventManager();
    const api = useApi();

    useEffect(() => {
        if (userSettings.Checklists?.includes(id)) {
            void withLoading(api<Checklist>(getChecklist(id)).then(setChecklist));
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
