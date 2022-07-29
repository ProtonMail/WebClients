import { ReactNode, createContext, useContext, useState } from 'react';

import { useApi } from '@proton/components';
import { hidePaidUserChecklist } from '@proton/shared/lib/api/checklist';
import { ChecklistKey } from '@proton/shared/lib/interfaces';

import useChecklist from './useChecklist';

interface ChecklistApiResponse {
    Items: ChecklistKey[];
    CreatedAt: number;
}

interface PaidUserChecklistContextValue {
    loading: boolean;
    dismissed: boolean;
    handleDismiss: () => void;
    checklist: ChecklistApiResponse['Items'];
}

const PaidUserChecklistContext = createContext<PaidUserChecklistContextValue>({} as PaidUserChecklistContextValue);

const PaidUserChecklistProvider = ({ children }: { children: ReactNode }) => {
    const [checklist, loadingChecklist] = useChecklist('paying-user');
    const api = useApi();
    const [dismissed, setDismissed] = useState(false);

    const handleDismiss = () => {
        setDismissed(true);
        void api({ ...hidePaidUserChecklist(), silence: true });
    };

    const context = {
        loading: loadingChecklist,
        checklist: checklist.Items,
        dismissed,
        handleDismiss,
    };

    return <PaidUserChecklistContext.Provider value={context}>{children}</PaidUserChecklistContext.Provider>;
};

export const usePaidUserChecklist = () => useContext(PaidUserChecklistContext) as PaidUserChecklistContextValue;

export default PaidUserChecklistProvider;
