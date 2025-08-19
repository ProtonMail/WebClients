import { type CYCLE, type Currency, PLANS, type PlanIDs, getPlanNameFromIDs } from '@proton/payments';
import { type ProductParam } from '@proton/shared/lib/apps/product';
import { HOUR, SECOND } from '@proton/shared/lib/constants';
import { telemetry } from '@proton/shared/lib/telemetry';

import type { SignupType } from './interfaces';

type FlowId =
    | 'legacy-signup' // Multi-step signup used from login page `Create account` click
    | 'single-page-signup' // Single page signup v1 - only used by vpn
    | 'single-page-signup-vpn' // Single page signup v2 - used by all other products
    | string;

export const sendSignupLoadTelemetry = ({
    planIDs,
    flowId,
    productIntent,
    currency,
    cycle,
}: {
    planIDs: PlanIDs;
    flowId: FlowId;
    productIntent: ProductParam;
    currency: Currency;
    cycle: CYCLE;
}) => {
    const selectedPlan = getPlanNameFromIDs(planIDs) || PLANS.FREE;

    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'signup_page_load_v1',
        {
            selectedPlan,
            flowId,
            productIntent: productIntent || 'generic',
            currency,
            cycle,
        }
    );
};

export const sendSignupAccountCreationTelemetry = ({
    planIDs,
    flowId,
    productIntent,
    currency,
    cycle,
    signupType,
    amount,
}: {
    planIDs: PlanIDs;
    flowId: FlowId;
    productIntent: ProductParam;
    currency: Currency | undefined;
    cycle: CYCLE | undefined;
    signupType: SignupType | undefined;
    amount: number | undefined;
}) => {
    const selectedPlan = getPlanNameFromIDs(planIDs) || PLANS.FREE;

    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'signup_account_creation_v1',
        {
            selectedPlan,
            flowId,
            productIntent: productIntent || 'generic',
            currency,
            cycle,
            signupType,
            amount,
        }
    );
};

export const sendSignupRecoveryPhraseSetTelemetry = ({
    flowId,
    productIntent,
}: {
    flowId: FlowId;
    productIntent: ProductParam;
}) => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'signup_recovery_phrase_set_v1',
        {
            flowId,
            productIntent: productIntent || 'generic',
        }
    );
};

export const sendSignupSubscriptionTelemetryEvent = ({
    planIDs,
    flowId,
    currency,
    cycle,
    userCreateTime,
    invoiceID,
    coupon,
    amount,
}: {
    planIDs: PlanIDs;
    flowId: FlowId;
    currency: Currency;
    cycle: CYCLE;
    userCreateTime: number;
    invoiceID: string;
    coupon: string | null;
    amount: number;
}) => {
    const nowInSeconds = Date.now() / SECOND;
    const userAgeInSeconds = nowInSeconds - userCreateTime;
    const immediatePaidSignup = userAgeInSeconds <= 120;
    const sameDaySignup = userAgeInSeconds <= (24 * HOUR) / SECOND;

    const selectedPlan = getPlanNameFromIDs(planIDs) || PLANS.FREE;

    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'subscription_update_v1',
        {
            selectedPlan,
            flowId,
            currency,
            cycle,
            immediatePaidSignup,
            sameDaySignup,
            userAgeInSeconds,
            invoiceID,
            coupon,
            amount,
        }
    );
};
