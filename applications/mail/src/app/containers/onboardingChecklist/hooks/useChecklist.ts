import { useEffect, useState } from 'react';

import { useApi, useEventManager, useFlag, useUserSettings } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getChecklist } from '@proton/shared/lib/api/checklist';
import { CHECKLIST_DISPLAY_TYPE, ChecklistId, ChecklistKey } from '@proton/shared/lib/interfaces';

import { Event } from '../../../models/event';

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

    // TODO remove once the extended checklist storage split is finished
    const TO_DELETE_FIX_FOR_CHECKLIST = useFlag('SplitStorageChecklistReopenedNova');
    const [userSettings] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const { subscribe } = useEventManager();
    const api = useApi();

    useEffect(() => {
        if ((TO_DELETE_FIX_FOR_CHECKLIST && id === 'get-started') || userSettings.Checklists?.includes(id)) {
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
