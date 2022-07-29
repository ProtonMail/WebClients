import { ReactNode, createContext, useContext, useState } from 'react';

import { addDays, fromUnixTime } from 'date-fns';

import * as sessionStorage from '@proton/shared/lib/helpers/sessionStorage';
import { ChecklistKey } from '@proton/shared/lib/interfaces';

import useChecklist, { GetStartedChecklistApiResponse } from './useChecklist';

const GET_STARTED_CHECKLIST_DISMISSED_STORAGE_KEY = 'GET_STARTED_CHECKLIST_DISMISSED_STORAGE_KEY';

interface ChecklistApiResponse {
    Items: ChecklistKey[];
    CreatedAt: number;
}

interface GetStartedChecklistContextValue {
    loading: boolean;
    dismissed: boolean;
    handleDismiss: () => void;
    checklist: ChecklistApiResponse['Items'];
    rewardInGb: GetStartedChecklistApiResponse['RewardInGB'];
    expires: Date;
}

const GetStartedChecklistContext = createContext<GetStartedChecklistContextValue>(
    {} as GetStartedChecklistContextValue
);

const GetStartedChecklistProvider = ({ children }: { children: ReactNode }) => {
    const [checklist, loadingChecklist] = useChecklist('get-started') as [GetStartedChecklistApiResponse, boolean];

    const [dismissed, setDismissed] = useState(() =>
        JSON.parse(sessionStorage.getItem(GET_STARTED_CHECKLIST_DISMISSED_STORAGE_KEY) || JSON.stringify(false))
    );

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem(GET_STARTED_CHECKLIST_DISMISSED_STORAGE_KEY, JSON.stringify(true));
    };

    const context = {
        loading: loadingChecklist,
        checklist: checklist.Items,
        rewardInGb: checklist.RewardInGB,
        expires: addDays(fromUnixTime(checklist.CreatedAt), 30),
        dismissed,
        handleDismiss,
    };

    return <GetStartedChecklistContext.Provider value={context}>{children}</GetStartedChecklistContext.Provider>;
};

export const useGetStartedChecklist = () => useContext(GetStartedChecklistContext) as GetStartedChecklistContextValue;

export default GetStartedChecklistProvider;
