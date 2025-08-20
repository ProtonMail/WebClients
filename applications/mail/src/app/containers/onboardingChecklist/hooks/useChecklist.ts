import { useEffect, useState } from 'react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi, useEventManager } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getChecklist } from '@proton/shared/lib/api/checklist';
import { APPS } from '@proton/shared/lib/constants';
import { getMailChecklistType } from '@proton/shared/lib/helpers/checklist';
import type { ChecklistApiResponse, ChecklistKey } from '@proton/shared/lib/interfaces';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import type { Event } from '../../../models/event';

export interface GetStartedChecklistApiResponse extends ChecklistApiResponse {
    RewardInGB: number;
}

export type Checklist = ChecklistApiResponse | GetStartedChecklistApiResponse;

const useChecklist = () => {
    const [checklist, setChecklist] = useState<Checklist>({
        Code: 0,
        Items: [] as ChecklistKey[],
        CreatedAt: 0,
        ExpiresAt: 0,
        UserWasRewarded: false,
        Visible: false,
        Display: CHECKLIST_DISPLAY_TYPE.HIDDEN,
    });

    const [userSettings] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const { subscribe } = useEventManager();
    const api = useApi();

    const checklistType = getMailChecklistType(userSettings, APPS.PROTONMAIL);

    useEffect(() => {
        if (!checklistType) {
            return;
        }

        if (userSettings.Checklists) {
            void withLoading(api<Checklist>(getChecklist(checklistType)).then(setChecklist));
        }

        const unsubscribe = subscribe((update) => {
            const checklistUpdate = update as Event; // TODO: Improve these types
            const Checklist = checklistUpdate?.Checklist;
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
    }, [userSettings, checklistType]);

    return { checklist, loading, checklistType };
};

export default useChecklist;
