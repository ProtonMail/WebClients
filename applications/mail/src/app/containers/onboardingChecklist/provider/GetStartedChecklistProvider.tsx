import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { fromUnixTime, isBefore } from 'date-fns';

import { useApi, useEventManager } from '@proton/components/hooks';
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

import useMailOnboardingVariant from 'proton-mail/components/onboarding/useMailOnboardingVariant';

import useCanCheckItem from '../hooks/useCanCheckItem';
import type { GetStartedChecklistApiResponse } from '../hooks/useChecklist';
import useChecklist from '../hooks/useChecklist';

const { REDUCED, HIDDEN } = CHECKLIST_DISPLAY_TYPE;

const completedChecklist = [
    ChecklistKey.AccountLogin,
    ChecklistKey.Import,
    ChecklistKey.ProtectInbox,
    ChecklistKey.MobileApp,
];

export interface ContextState {
    expiresAt: Date;
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

const GetStartedChecklistContext = createContext<ContextState>({} as ContextState);

const GetStartedChecklistProvider = ({ children }: { children: ReactNode }) => {
    const api = useApi();
    const { variant: onboardingVariant } = useMailOnboardingVariant();
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
    const isChecklistFinished = completedChecklist?.every((item) => items?.includes(item));

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
            if (newState === REDUCED && onboardingVariant !== 'none') {
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

    const getExpiredAt = (): Date =>
        isUserPaid ? fromUnixTime(paidUserChecklist.ExpiresAt) : fromUnixTime(freeUserChecklist.ExpiresAt);

    const canDisplayChecklist = isBefore(new Date(), getExpiredAt());

    const context: ContextState = {
        isUserPaid,
        loading: isLoading,
        isChecklistFinished,
        changeChecklistDisplay,
        userWasRewarded: isUserPaid ? paidUserChecklist.UserWasRewarded : freeUserChecklist.UserWasRewarded,
        items: new Set([...doneItems]),
        displayState,
        expiresAt: getExpiredAt(),
        markItemsAsDone,
        canDisplayChecklist,
    };

    return <GetStartedChecklistContext.Provider value={context}>{children}</GetStartedChecklistContext.Provider>;
};

export const useGetStartedChecklist = () => useContext(GetStartedChecklistContext) as ContextState;

export default GetStartedChecklistProvider;
