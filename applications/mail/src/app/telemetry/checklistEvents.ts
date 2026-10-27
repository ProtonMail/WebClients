import { differenceInDays } from 'date-fns';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { ImportProvider } from '@proton/activation/src/interface';
import { TelemetryMailOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';
import { ChecklistKey, ChecklistType } from '@proton/shared/lib/interfaces/Checklist';
import { defineEvent } from '@proton/telemetry-tracker/lib/defineEvent';
import { allowed, number, topValues } from '@proton/telemetry-tracker/lib/dimensions';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import type { OnlineServicesKey } from '../components/onboarding/checklist/constants';
import { ONLINE_SERVICES } from '../components/onboarding/checklist/constants';
import { getPlanDimension } from './onboardingEvents';

/**
 * The checklist is not a funnel: its items can be done in any order, over several days.
 * - the items are the steps that can be completed (`import`, `protect_inbox`, ...)
 * - the screens and the sidebar are the places where the user interacts with it
 */
export enum CHECKLIST_STEPS {
    import = 'import',
    protectInbox = 'protect_inbox',
    mobileApp = 'mobile_app',
    claimAddress = 'claim_address',
    importersScreen = 'importers_screen',
    accountsScreen = 'accounts_screen',
    sidebar = 'sidebar',
}

export enum CHECKLIST_ACTIONS {
    skip = 'skip',
    copyAddress = 'copy_address',
    selectService = 'select_service',
    selectProvider = 'select_provider',
    close = 'close',
    openItem = 'open_item',
    expand = 'expand',
    collapse = 'collapse',
    reduce = 'reduce',
}

/** What moved the checklist from the full screen to the sidebar */
export enum CHECKLIST_REDUCE_TRIGGERS {
    user = 'user',
    inboxLimit = 'inbox_limit',
}

/** The checklist the user sees, the items to complete depend on it */
export enum CHECKLIST_TYPES {
    mailFree = 'mail_free',
    mailPaid = 'mail_paid',
    mailBYOE = 'mail_byoe',
}

const CHECKLIST_ITEM_STEPS: Partial<Record<ChecklistKey, CHECKLIST_STEPS>> = {
    [ChecklistKey.Import]: CHECKLIST_STEPS.import,
    [ChecklistKey.ProtectInbox]: CHECKLIST_STEPS.protectInbox,
    [ChecklistKey.MobileApp]: CHECKLIST_STEPS.mobileApp,
    [ChecklistKey.ClaimAddress]: CHECKLIST_STEPS.claimAddress,
};

/** `undefined` for the items that are not displayed in the checklist (`AccountLogin` is checked automatically) */
export const getChecklistItemStep = (item: ChecklistKey) => CHECKLIST_ITEM_STEPS[item];

const getChecklistTypeDimension = (checklistType: ChecklistType | undefined) => {
    switch (checklistType) {
        case ChecklistType.MailFreeUser:
            return CHECKLIST_TYPES.mailFree;
        case ChecklistType.MailPaidUser:
            return CHECKLIST_TYPES.mailPaid;
        case ChecklistType.MailBYOEUser:
            return CHECKLIST_TYPES.mailBYOE;
        default:
            return undefined;
    }
};

const baseDimensions = {
    flow: allowed(['checklist']),
    step: allowed(Object.values(CHECKLIST_STEPS)),
    checklistType: allowed(Object.values(CHECKLIST_TYPES)),
    /** Same as the onboarding: plans the user holds, `free` when none, `unknown` while they load */
    plan: topValues(),
};

const baseEvent = {
    target: 'telemetry',
    group: TelemetryMeasurementGroups.mailOnboarding,
    values: {
        /** Days since the checklist was created */
        daysSinceCreated: number(),
        /** Days before the checklist expires, not sent when it never expires (user who registered with a paid plan) */
        daysRemaining: number(),
    },
} as const;

/** A screen of the full screen checklist is displayed */
const stepLoad = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepLoad,
    dimensions: baseDimensions,
});

const stepInteracted = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepInteracted,
    dimensions: { ...baseDimensions, action: allowed(Object.values(CHECKLIST_ACTIONS)) },
});

/** Same event as `stepInteracted`, for the `select_service` action: which service the user wants to switch */
const serviceSelected = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepInteracted,
    dimensions: {
        ...baseDimensions,
        action: allowed([CHECKLIST_ACTIONS.selectService]),
        service: allowed(ONLINE_SERVICES.map(({ key }) => key)),
    },
});

/** Same event as `stepInteracted`, for the `select_provider` action: which provider the user wants to import from */
const providerSelected = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepInteracted,
    dimensions: {
        ...baseDimensions,
        action: allowed([CHECKLIST_ACTIONS.selectProvider]),
        provider: allowed(Object.values(ImportProvider)),
    },
});

/** Same event as `stepInteracted`, for the `reduce` action: the checklist moves to the sidebar, and why */
const checklistReduced = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepInteracted,
    dimensions: {
        ...baseDimensions,
        action: allowed([CHECKLIST_ACTIONS.reduce]),
        trigger: allowed(Object.values(CHECKLIST_REDUCE_TRIGGERS)),
    },
});

const stepCompleted = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepCompleted,
    dimensions: baseDimensions,
});

const flowFinished = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.flowFinished,
    dimensions: { flow: baseDimensions.flow, plan: baseDimensions.plan, checklistType: baseDimensions.checklistType },
});

/** The user hides the checklist before completing it */
const flowDismissed = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.flowDismissed,
    dimensions: baseDimensions,
});

export interface ChecklistTrackingContext {
    /** Events are only sent for a checklist the user can see */
    canDisplayChecklist: boolean;
    checklistType: ChecklistType | undefined;
    createdAt: Date;
    /** `undefined` when the checklist never expires */
    expiresAt: Date | undefined;
}

const getLoadedKey = (step: CHECKLIST_STEPS) => `mail-checklist-loaded-${step}`;

/**
 * The checklist has no funnel, so there is no timer: the age of the checklist is sent instead.
 * Components use it through `useChecklistTracking`.
 */
export const useChecklistTracker = ({
    canDisplayChecklist,
    checklistType,
    createdAt,
    expiresAt,
}: ChecklistTrackingContext) => {
    const [subscriptions] = useAllSubscriptions();
    // `unknown` while the subscriptions load, so a paid user is never reported as free
    const plan = subscriptions ? getPlanDimension(subscriptions) : 'unknown';
    const checklistTypeDimension = getChecklistTypeDimension(checklistType);

    const getValues = () => {
        const now = new Date();
        return {
            daysSinceCreated: differenceInDays(now, createdAt),
            daysRemaining: expiresAt ? Math.max(0, differenceInDays(expiresAt, now)) : undefined,
        };
    };

    /** Runs `send` only when the user sees a checklist, with what every event of the checklist carries */
    const withChecklist = (send: (base: { plan: string; checklistType: CHECKLIST_TYPES }) => void) => {
        if (canDisplayChecklist && checklistTypeDimension) {
            send({ plan, checklistType: checklistTypeDimension });
        }
    };

    return {
        /** Once per browser session and screen: the screens are mounted again when the user changes folder */
        trackStepLoaded: (step: CHECKLIST_STEPS) =>
            withChecklist((base) => {
                if (!getItem(getLoadedKey(step))) {
                    setItem(getLoadedKey(step), 'true');
                    tracker.emit(stepLoad, { dimensions: { flow: 'checklist', step, ...base }, values: getValues() });
                }
            }),
        trackStepInteracted: (step: CHECKLIST_STEPS, action: CHECKLIST_ACTIONS) =>
            withChecklist((base) =>
                tracker.emit(stepInteracted, {
                    dimensions: { flow: 'checklist', step, action, ...base },
                    values: getValues(),
                })
            ),
        trackProviderSelected: (provider: ImportProvider) =>
            withChecklist((base) =>
                tracker.emit(providerSelected, {
                    dimensions: {
                        flow: 'checklist',
                        step: CHECKLIST_STEPS.importersScreen,
                        action: CHECKLIST_ACTIONS.selectProvider,
                        provider,
                        ...base,
                    },
                    values: getValues(),
                })
            ),
        trackServiceSelected: (service: OnlineServicesKey) =>
            withChecklist((base) =>
                tracker.emit(serviceSelected, {
                    dimensions: {
                        flow: 'checklist',
                        step: CHECKLIST_STEPS.accountsScreen,
                        action: CHECKLIST_ACTIONS.selectService,
                        service,
                        ...base,
                    },
                    values: getValues(),
                })
            ),
        /** `step` is where the user lands, the sidebar */
        trackChecklistReduced: (trigger: CHECKLIST_REDUCE_TRIGGERS) =>
            withChecklist((base) =>
                tracker.emit(checklistReduced, {
                    dimensions: {
                        flow: 'checklist',
                        step: CHECKLIST_STEPS.sidebar,
                        action: CHECKLIST_ACTIONS.reduce,
                        trigger,
                        ...base,
                    },
                    values: getValues(),
                })
            ),
        trackStepCompleted: (step: CHECKLIST_STEPS) =>
            withChecklist((base) =>
                tracker.emit(stepCompleted, { dimensions: { flow: 'checklist', step, ...base }, values: getValues() })
            ),
        trackFlowFinished: () =>
            withChecklist((base) =>
                tracker.emit(flowFinished, { dimensions: { flow: 'checklist', ...base }, values: getValues() })
            ),
        trackFlowDismissed: () =>
            withChecklist((base) =>
                tracker.emit(flowDismissed, {
                    dimensions: { flow: 'checklist', step: CHECKLIST_STEPS.sidebar, ...base },
                    values: getValues(),
                })
            ),
    };
};
