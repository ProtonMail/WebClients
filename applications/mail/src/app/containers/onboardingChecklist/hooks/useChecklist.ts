import { useEffect, useState } from 'react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi, useEventManager } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getChecklist } from '@proton/shared/lib/api/checklist';
import type { ChecklistId, ChecklistKey } from '@proton/shared/lib/interfaces';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import type { Event } from '../../../models/event';

interface ChecklistApiResponse {
    Code: number;
    Items: ChecklistKey[];
    CreatedAt: number;
    ExpiresAt: number;
    UserWasRewarded: boolean;
    Display: CHECKLIST_DISPLAY_TYPE;
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
        UserWasRewarded: false,
        Display: CHECKLIST_DISPLAY_TYPE.HIDDEN,
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
            Checklist?.forEach(({ CompletedItem, Display }) => {
                setChecklist((current) => ({
                    ...current,
                    Items: [...current.Items, CompletedItem],
                    Display: Display || current.Display,
                }));
            });
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userSettings]);

    return [checklist, loading] as const;
};

export default useChecklist;
