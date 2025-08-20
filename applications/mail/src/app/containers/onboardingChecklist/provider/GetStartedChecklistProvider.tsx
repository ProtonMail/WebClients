import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { fromUnixTime } from 'date-fns';

import { useUser } from '@proton/account/user/hooks';
import { useApi, useEventManager } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { seenCompletedChecklist, updateChecklistDisplay, updateChecklistItem } from '@proton/shared/lib/api/checklist';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { type ChecklistApiResponse, type ChecklistKeyType, ChecklistType } from '@proton/shared/lib/interfaces';
import { CHECKLIST_DISPLAY_TYPE, ChecklistKey } from '@proton/shared/lib/interfaces';

import useCanCheckItem from '../hooks/useCanCheckItem';
import type { GetStartedChecklistApiResponse } from '../hooks/useChecklist';
import useChecklist from '../hooks/useChecklist';

const { REDUCED, HIDDEN } = CHECKLIST_DISPLAY_TYPE;

export const getMailChecklistItemsToComplete = (checklistType?: ChecklistType) => {
    if (!checklistType) {
        return [];
    }

    switch (checklistType) {
        case ChecklistType.MailBYOEUser:
            return [ChecklistKey.ProtectInbox, ChecklistKey.MobileApp, ChecklistKey.ClaimAddress];
        default:
            return [ChecklistKey.AccountLogin, ChecklistKey.Import, ChecklistKey.ProtectInbox, ChecklistKey.MobileApp];
    }
};

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
    itemsToComplete: ChecklistKeyType[];
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
    const [user] = useUser();
    const [submitting, withSubmitting] = useLoading();
    const { canMarkItemsAsDone } = useCanCheckItem();

    // This is used in the checklist to make optimistic UI updates. It marks the checklist item as done or store the display state
    const [doneItems, setDoneItems] = useState<ChecklistKeyType[]>([]);
    const [displayState, setDisplayState] = useState<CHECKLIST_DISPLAY_TYPE>(HIDDEN);

    const { checklist, loading, checklistType } = useChecklist();

    const items = checklist.Items;
    const itemsToComplete = getMailChecklistItemsToComplete(checklistType);
    const isChecklistFinished = itemsToComplete.every((item) => items?.includes(item)) && itemsToComplete.length > 0;

    const createdAt: Date = (() => {
        const timestamp = checklist.CreatedAt;
        // Ensure timestamp is a valid number
        return fromUnixTime(timestamp);
    })();
    const expiresAt: Date | undefined = (() => {
        const timestamp = checklist.ExpiresAt;
        return timestamp ? fromUnixTime(timestamp) : undefined;
    })();
    // // To prevent old users from seeing the checklist again
    const canDisplayChecklist: boolean = createdAt > new Date('2024-10-20');

    useEffect(() => {
        if (submitting) {
            return;
        }

        setDoneItems(checklist.Items ?? []);
        setDisplayState(checklist.Display);
    }, [checklist, submitting]);

    const markItemsAsDone = async (item: ChecklistKeyType) => {
        setDoneItems([...doneItems, item]);
        if (canMarkItemsAsDone && checklistType) {
            await silentApi(updateChecklistItem(item, checklistType));
            await call();
        }
    };

    const changeChecklistDisplay = (newState: CHECKLIST_DISPLAY_TYPE) => {
        setDisplayState(newState);
        void withSubmitting(async () => {
            // Reduce the checklist and mark first checklist item as done
            if (newState === REDUCED) {
                const items = checklist.Items;
                if (!items.includes(ChecklistKey.ProtectInbox)) {
                    setDoneItems([...doneItems, ChecklistKey.ProtectInbox]);
                    if (canMarkItemsAsDone && checklistType) {
                        await silentApi(updateChecklistItem('ProtectInbox', checklistType));
                        await call();
                    }
                }
            }

            if (isChecklistFinished && (newState === REDUCED || newState === HIDDEN)) {
                if (canMarkItemsAsDone && checklistType) {
                    await silentApi(seenCompletedChecklist(checklistType));
                }
            }

            if ((canMarkItemsAsDone || (newState === HIDDEN && user.hasPaidMail)) && checklistType) {
                await api(updateChecklistDisplay(newState, checklistType));
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
        isUserPaid: user.hasPaidMail,
        items: new Set([...doneItems]),
        loading,
        markItemsAsDone,
        userWasRewarded: checklist.UserWasRewarded,
        itemsToComplete,
    };

    return <GetStartedChecklistContext.Provider value={context}>{children}</GetStartedChecklistContext.Provider>;
};

export default GetStartedChecklistProvider;
