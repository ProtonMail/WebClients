import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { addDays, fromUnixTime } from 'date-fns';
import { useApi, useEventManager, useLoading, useUserSettings } from '@proton/components';
import { getChecklist } from '@proton/shared/lib/api/checklist';
import { GetStartedChecklistKey } from '@proton/shared/lib/interfaces';
import * as sessionStorage from '@proton/shared/lib/helpers/sessionStorage';

import { Event } from '../models/event';

const GET_STARTED_CHECKLIST_DISMISSED_STORAGE_KEY = 'GET_STARTED_CHECKLIST_DISMISSED_STORAGE_KEY';

interface ChecklistApiResponse {
    Items: GetStartedChecklistKey[];
    CreatedAt: number;
}

interface GetStartedChecklistContextValue {
    loading: boolean;
    dismissed: boolean;
    handleDismiss: () => void;
    checklist: ChecklistApiResponse['Items'];
    expires: Date;
}

export const GetStartedChecklistContext = createContext<GetStartedChecklistContextValue>(
    {} as GetStartedChecklistContextValue
);

const GetStartedChecklistProvider = ({ children }: { children: ReactNode }) => {
    const [checklist, setChecklist] = useState<ChecklistApiResponse>({
        Items: [],
        CreatedAt: 0,
    });

    const [userSettings] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const { subscribe } = useEventManager();
    const api = useApi();

    const [dismissed, setDismissed] = useState(() =>
        JSON.parse(sessionStorage.getItem(GET_STARTED_CHECKLIST_DISMISSED_STORAGE_KEY) || JSON.stringify(false))
    );

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem(GET_STARTED_CHECKLIST_DISMISSED_STORAGE_KEY, JSON.stringify(true));
    };

    useEffect(() => {
        if (userSettings.Checklists?.includes('get-started')) {
            withLoading(
                api<{ Items: GetStartedChecklistKey[]; CreatedAt: number }>(getChecklist('get-started')).then(
                    setChecklist
                )
            );
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

    const context = {
        loading,
        checklist: checklist.Items,
        expires: addDays(fromUnixTime(checklist.CreatedAt), 30),
        dismissed,
        handleDismiss,
    };

    return <GetStartedChecklistContext.Provider value={context}>{children}</GetStartedChecklistContext.Provider>;
};

export default GetStartedChecklistProvider;
