import { useRef } from 'react';

import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useConfig from '@proton/components/hooks/useConfig';
import { PLANS, type PlanIDs } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, type APP_NAMES, MAIL_UPSELL_PATHS, SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { getPlanNameFromIDs } from '@proton/shared/lib/helpers/planIDs';
import useFlag from '@proton/unleash/useFlag';

import type { SubscriptionOverridableStep } from '../SubscriptionModalProvider';
import PostSubscriptionModal from './PostSubscriptionModal';
import type { PostSubscriptionFlowName } from './interface';

const ALLOWED_APPS: APP_NAMES[] = [APPS.PROTONMAIL];

const ELIGIBLE_PLANS = [PLANS.MAIL, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY];

const UPSELL_PATH_TO_FLOW_NAME_MAP = {
    [MAIL_UPSELL_PATHS.SHORT_ADDRESS]: 'mail-short-domain',
    [MAIL_UPSELL_PATHS.DARK_WEB_MONITORING]: 'dark-web-monitoring',
    [MAIL_UPSELL_PATHS.AUTO_DELETE]: 'mail-auto-delete',
    [MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS]: 'mail-folders',
    [MAIL_UPSELL_PATHS.UNLIMITED_LABELS]: 'mail-labels',
    [MAIL_UPSELL_PATHS.PROTON_SENTINEL]: 'sentinel',
    [SHARED_UPSELL_PATHS.SENTINEL]: 'sentinel',
} as const;

/**
 * Determines the post-subscription flow name based on upsell ref or plan ID
 * @param upsellRef - The upsell reference string to check against eligible upsells
 * @param planIDs - The plan IDs to validate against eligible plans
 * @returns The post-subscription flow name if eligible, undefined otherwise
 */
const getPostSubscriptionFlowName = (
    upsellRef: string | undefined,
    planIDs: PlanIDs
): PostSubscriptionFlowName | undefined => {
    const upsellRefMatch = (
        Object.keys(UPSELL_PATH_TO_FLOW_NAME_MAP) as (keyof typeof UPSELL_PATH_TO_FLOW_NAME_MAP)[]
    ).find((key) => upsellRef?.includes(key));

    if (upsellRefMatch) {
        return UPSELL_PATH_TO_FLOW_NAME_MAP[upsellRefMatch];
    }

    const isEligiblePlan = ELIGIBLE_PLANS.some((planName) => {
        const selectedPlan = getPlanNameFromIDs(planIDs);
        return selectedPlan !== undefined && selectedPlan === planName;
    });

    if (isEligiblePlan) {
        return 'generic';
    }

    return undefined;
};

export const usePostSubscription = () => {
    const [user] = useUser();
    /** Allow to ensure user was free before subscribing */
    const userIsFreeRef = useRef<boolean>(user.isFree);
    const isPostSubscriptionFlowEnabled = useFlag('InboxWebPostSubscriptionFlow');
    const { APP_NAME } = useConfig();

    /**
     * Post subscription flow is displayed only if:
     * - User is on an allowed app (app settings included)
     * - Feature flag is enabled
     * - User was on free plan before subscribing
     */
    const canShowPostSubscriptionFlow = (() => {
        const isAllowedApp = (() => {
            if (APP_NAME === 'proton-account') {
                const appFromPathname = getAppFromPathnameSafe(window.location.pathname);
                return ALLOWED_APPS.some((allowedApp) => allowedApp === appFromPathname);
            }
            return ALLOWED_APPS.some((app) => app === APP_NAME);
        })();

        return isAllowedApp && isPostSubscriptionFlowEnabled && userIsFreeRef.current;
    })();

    return {
        // We must force thanks step display in the UpsellModal config
        ...(canShowPostSubscriptionFlow ? { disableThanksStep: false } : {}),
        renderCustomStepModal: ({
            modalProps,
            step,
            upsellRef,
            planIDs,
        }: {
            /** Subscription modal props we reuse wit our modal overrides */
            modalProps: ModalStateProps;
            /** Subscription flow step we're in */
            step: SubscriptionOverridableStep;
            upsellRef: string | undefined;
            /** User selected plans */
            planIDs: PlanIDs;
        }) => {
            if (!canShowPostSubscriptionFlow) {
                return undefined;
            }

            const flowName = getPostSubscriptionFlowName(upsellRef, planIDs);

            if (!flowName) {
                return undefined;
            }

            return (
                <PostSubscriptionModal
                    {...modalProps}
                    onClose={() => {
                        modalProps.onClose?.();
                        userIsFreeRef.current = false;
                    }}
                    step={step}
                    name={flowName}
                    upsellRef={upsellRef}
                />
            );
        },
    };
};
