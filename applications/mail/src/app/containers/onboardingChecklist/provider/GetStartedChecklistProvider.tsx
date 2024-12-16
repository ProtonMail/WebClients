import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { fromUnixTime } from 'date-fns';

import { useApi, useEventManager } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import {
    hidePaidUserChecklist,
    seenCompletedChecklist,
    updateChecklistDisplay,
    updateChecklistItem,
} from '@proton/shared/lib/api/checklist';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ChecklistApiResponse, ChecklistKeyType } from '@proton/shared/lib/interfaces';
import { CHECKLIST_DISPLAY_TYPE, ChecklistKey } from '@proton/shared/lib/interfaces';

import useCanCheckItem from '../hooks/useCanCheckItem';
import type { GetStartedChecklistApiResponse } from '../hooks/useChecklist';
import useChecklist from '../hooks/useChecklist';

const { REDUCED, HIDDEN } = CHECKLIST_DISPLAY_TYPE;

export const CHECKLIST_ITEMS_TO_COMPLETE = [
    ChecklistKey.AccountLogin,
    ChecklistKey.Import,
    ChecklistKey.ProtectInbox,
    ChecklistKey.MobileApp,
];

export interface OnboardingChecklistContext {
    /**
     * If user registered first with a paid plan
     * `expiresAt` is undefined
     */
    expiresAt: Date | undefined;
    createdAt: Date;
    loading: boolean;
    isUserPaid: boolean;
    isChecklistFinished: boolean;
    items: Set<ChecklistKeyType>;
    displayState: ChecklistApiResponse['Display'];
    userWasRewarded: GetStartedChecklistApiResponse['UserWasRewarded'];
    changeChecklistDisplay: (display: CHECKLIST_DISPLAY_TYPE) => void;
    markItemsAsDone: (item: ChecklistKeyType) => void;
    canDisplayChecklist: boolean;
}

const GetStartedChecklistContext = createContext<OnboardingChecklistContext | undefined>(undefined);

export const useGetStartedChecklist = () => {
    const context = useContext(GetStartedChecklistContext);

    if (context === undefined) {
        throw new Error('useGetStartedChecklist must be used within a GetStartedChecklistProvider');
    }

    return context;
};

const GetStartedChecklistProvider = ({ children }: { children: ReactNode }) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const { call } = useEventManager();
    const [submitting, withSubmitting] = useLoading();
    const { canMarkItemsAsDone } = useCanCheckItem();

    // This is used in the checklist to make optimistic UI updates. It marks the checklist item as done or store the display state
    const [doneItems, setDoneItems] = useState<ChecklistKeyType[]>([]);
    const [displayState, setDisplayState] = useState<CHECKLIST_DISPLAY_TYPE>(HIDDEN);

    const [freeUserChecklist, loadingFreeChecklist] = useChecklist('get-started') as [
        GetStartedChecklistApiResponse,
        boolean,
    ];
    const [paidUserChecklist, loadingPaidChecklist] = useChecklist('paying-user') as [
        GetStartedChecklistApiResponse,
        boolean,
    ];

    const isLoading = loadingFreeChecklist || loadingPaidChecklist;
    const isUserPaid = paidUserChecklist.Code === 1000;
    const items = isUserPaid ? paidUserChecklist.Items : freeUserChecklist.Items;
    const isChecklistFinished = CHECKLIST_ITEMS_TO_COMPLETE?.every((item) => items?.includes(item));

    const createdAt: Date = (() => {
        const timestamp = isUserPaid ? paidUserChecklist.CreatedAt : freeUserChecklist.CreatedAt;
        // Ensure timestamp is a valid number
        return fromUnixTime(timestamp);
    })();
    const expiresAt: Date | undefined = (() => {
        const timestamp = isUserPaid ? paidUserChecklist.ExpiresAt : freeUserChecklist.ExpiresAt;
        return timestamp ? fromUnixTime(timestamp) : undefined;
    })();
    // // To prevent old users from seeing the checklist again
    const canDisplayChecklist: boolean = createdAt > new Date('2024-10-20');

    useEffect(() => {
        if (submitting) {
            return;
        }

        if (isUserPaid) {
            setDoneItems(paidUserChecklist.Items ?? []);
            setDisplayState(paidUserChecklist.Display);
        } else {
            setDoneItems(freeUserChecklist.Items ?? []);
            setDisplayState(freeUserChecklist.Display);
        }
    }, [freeUserChecklist, paidUserChecklist, submitting]);

    const markItemsAsDone = async (item: ChecklistKeyType) => {
        setDoneItems([...doneItems, item]);
        if (canMarkItemsAsDone) {
            await silentApi(updateChecklistItem(item));
            await call();
        }
    };

    const changeChecklistDisplay = (newState: CHECKLIST_DISPLAY_TYPE) => {
        setDisplayState(newState);
        void withSubmitting(async () => {
            // Reduce the checklist and mark first checklist item as done
            if (newState === REDUCED) {
                const items = isUserPaid ? paidUserChecklist.Items : freeUserChecklist.Items;
                if (!items.includes(ChecklistKey.ProtectInbox)) {
                    setDoneItems([...doneItems, ChecklistKey.ProtectInbox]);
                    if (canMarkItemsAsDone) {
                        await silentApi(updateChecklistItem('ProtectInbox'));
                        await call();
                    }
                }
            }

            // Send information to the backend when paid user hide the checklist
            if (newState === HIDDEN && isUserPaid) {
                await silentApi(hidePaidUserChecklist());
            }

            if (isChecklistFinished && (newState === REDUCED || newState === HIDDEN)) {
                const checklist = isUserPaid ? 'paying-user' : 'get-started';
                if (canMarkItemsAsDone) {
                    await silentApi(seenCompletedChecklist(checklist));
                }
            }

            if (canMarkItemsAsDone) {
                await api(updateChecklistDisplay(newState));
                await call();
            }
        });
    };

    const context: OnboardingChecklistContext = {
        canDisplayChecklist,
        changeChecklistDisplay,
        createdAt,
        displayState,
        expiresAt,
        isChecklistFinished,
        isUserPaid,
        items: new Set([...doneItems]),
        loading: isLoading,
        markItemsAsDone,
        userWasRewarded: isUserPaid ? paidUserChecklist.UserWasRewarded : freeUserChecklist.UserWasRewarded,
    };

    return <GetStartedChecklistContext.Provider value={context}>{children}</GetStartedChecklistContext.Provider>;
};

export default GetStartedChecklistProvider;
