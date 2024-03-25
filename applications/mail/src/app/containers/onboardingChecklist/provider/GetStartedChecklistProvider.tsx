import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { fromUnixTime, isBefore } from 'date-fns';

import { useApi, useEventManager, useSubscription, useUser, useUserSettings } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import {
    hidePaidUserChecklist,
    seenCompletedChecklist,
    updateChecklistDisplay,
    updateChecklistItem,
} from '@proton/shared/lib/api/checklist';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { canCheckItemGetStarted, canCheckItemPaidChecklist } from '@proton/shared/lib/helpers/subscription';
import {
    CHECKLIST_DISPLAY_TYPE,
    ChecklistApiResponse,
    ChecklistKey,
    ChecklistKeyType,
} from '@proton/shared/lib/interfaces';

import useChecklist, { GetStartedChecklistApiResponse } from '../hooks/useChecklist';

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
    const silentApi = getSilentApi(api);
    const { call } = useEventManager();
    const [submitting, withSubmitting] = useLoading();
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();
    const canMarkItemsAsDone =
        (canCheckItemPaidChecklist(subscription) && userSettings.Checklists?.includes('paying-user')) ||
        (canCheckItemGetStarted(subscription) && userSettings.Checklists?.includes('get-started')) ||
        user.isFree;

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
        withSubmitting(async () => {
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
