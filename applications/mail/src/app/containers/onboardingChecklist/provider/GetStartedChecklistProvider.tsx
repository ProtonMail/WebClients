import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { fromUnixTime } from 'date-fns';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import useLoading from '@proton/hooks/useLoading';
import { seenCompletedChecklist, updateChecklistDisplay, updateChecklistItem } from '@proton/shared/lib/api/checklist';
import {
    CHECKLIST_DISPLAY_TYPE,
    type ChecklistApiResponse,
    ChecklistKey,
    type ChecklistKeyType,
    ChecklistType,
} from '@proton/shared/lib/interfaces';

import type { CHECKLIST_REDUCE_TRIGGERS } from '../../../telemetry/checklistEvents';
import { getChecklistItemStep, useChecklistTracker } from '../../../telemetry/checklistEvents';
import type { GetStartedChecklistApiResponse } from '../hooks/useChecklist';
import useChecklist from '../hooks/useChecklist';

export const getMailChecklistItemsToComplete = (checklistType?: ChecklistType) => {
    if (!checklistType) {
        return [];
    }

    switch (checklistType) {
        case ChecklistType.MailBYOEUser:
            return [ChecklistKey.ProtectInbox, ChecklistKey.MobileApp, ChecklistKey.ClaimAddress];
        default:
            return [ChecklistKey.Import, ChecklistKey.ProtectInbox, ChecklistKey.MobileApp];
    }
};

/** The reason is required when the checklist is reduced to the sidebar, it is sent with the telemetry event */
interface ChangeChecklistDisplay {
    (display: CHECKLIST_DISPLAY_TYPE.REDUCED, trigger: CHECKLIST_REDUCE_TRIGGERS): void;
    (display: CHECKLIST_DISPLAY_TYPE.FULL | CHECKLIST_DISPLAY_TYPE.HIDDEN): void;
}

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
    changeChecklistDisplay: ChangeChecklistDisplay;
    markItemsAsDone: (item: ChecklistKeyType) => Promise<void>;
    canDisplayChecklist: boolean;
    itemsToComplete: ChecklistKeyType[];
    /**
     * When true, prevents the checklist from auto-collapsing while a BYOE flow is in progress.
     * The checklist would normally collapse when the inbox fills up (>= 5 messages), but during
     * a BYOE setup the import starts immediately, and we want to display success modals
     */
    byoeFlowInProgress: boolean;
    setByoeFlowInProgress: (value: boolean) => void;
    checklistType: ChecklistType | undefined;
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
    const silentApi = useSilentApi();
    const { call } = useEventManager();
    const [user] = useUser();
    const [submitting, withSubmitting] = useLoading();

    // This is used in the checklist to make optimistic UI updates. It marks the checklist item as done or store the display state
    const [doneItems, setDoneItems] = useState<ChecklistKeyType[]>([]);
    const [displayState, setDisplayState] = useState<CHECKLIST_DISPLAY_TYPE>(CHECKLIST_DISPLAY_TYPE.HIDDEN);
    const [byoeFlowInProgress, setByoeFlowInProgress] = useState(false);

    const { checklist, loading, checklistType } = useChecklist();

    const itemsToComplete = getMailChecklistItemsToComplete(checklistType);
    const isChecklistFinished = itemsToComplete.every((item) => doneItems.includes(item)) && itemsToComplete.length > 0;

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
        // Don't update display state while BYOE flow is in progress to prevent
        // unmounting ConnectGmailButton and losing its local state mid-flow.
        if (!byoeFlowInProgress) {
            setDisplayState(checklist.Display);
        }
    }, [checklist, submitting, byoeFlowInProgress]);

    const tracking = useChecklistTracker({ canDisplayChecklist, checklistType, createdAt, expiresAt });

    const markItemsAsDone = async (item: ChecklistKeyType) => {
        const step = getChecklistItemStep(ChecklistKey[item]);
        if (step && !doneItems.includes(item)) {
            tracking.trackStepCompleted(step);
        }

        setDoneItems((state) => [...state, item]);
        if (checklistType) {
            await silentApi(updateChecklistItem(item, checklistType));
            await call();
        }
    };

    /*
     * To go faster with BYOE updates, we decided to update the old checklist frontend side only.
     * AccountLogin step is no longer visible in the checklist, so to allow the checklist to be completed,
     * we need to always check this item.
     *
     * If we update the checklist in the future, this code needs to be removed.
     */
    useEffect(() => {
        if (
            checklistType &&
            checklistType !== ChecklistType.MailBYOEUser &&
            !checklist.Items?.includes(ChecklistKey.AccountLogin)
        ) {
            void markItemsAsDone('AccountLogin');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checklist.Items, checklistType]);

    const changeChecklistDisplay: ChangeChecklistDisplay = (
        newState: CHECKLIST_DISPLAY_TYPE,
        trigger?: CHECKLIST_REDUCE_TRIGGERS
    ) => {
        if (newState === CHECKLIST_DISPLAY_TYPE.REDUCED && trigger) {
            tracking.trackChecklistReduced(trigger);
        }

        setDisplayState(newState);
        void withSubmitting(async () => {
            // Reduce the checklist and mark first checklist item as done
            if (newState === CHECKLIST_DISPLAY_TYPE.REDUCED) {
                const items = checklist.Items;
                if (!items.includes(ChecklistKey.ProtectInbox)) {
                    setDoneItems((items) => [...items, ChecklistKey.ProtectInbox]);
                    if (checklistType) {
                        await silentApi(updateChecklistItem('ProtectInbox', checklistType));
                        await call();
                    }
                }
            }

            if (
                isChecklistFinished &&
                (newState === CHECKLIST_DISPLAY_TYPE.REDUCED || newState === CHECKLIST_DISPLAY_TYPE.HIDDEN)
            ) {
                if (checklistType) {
                    await silentApi(seenCompletedChecklist(checklistType));
                }
            }

            if (checklistType) {
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
        items: new Set(doneItems),
        loading,
        markItemsAsDone,
        userWasRewarded: checklist.UserWasRewarded,
        itemsToComplete,
        byoeFlowInProgress,
        setByoeFlowInProgress,
        checklistType,
    };

    return <GetStartedChecklistContext.Provider value={context}>{children}</GetStartedChecklistContext.Provider>;
};

export default GetStartedChecklistProvider;
