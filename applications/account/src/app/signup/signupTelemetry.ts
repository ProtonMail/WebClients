import { type CYCLE, type Currency, PLANS, type PlanIDs, getPlanNameFromIDs } from '@proton/payments/index';
import { type APP_NAMES } from '@proton/shared/lib/constants';
import { telemetry } from '@proton/shared/lib/telemetry';

import type { SignupType } from './interfaces';

type FlowId =
    | 'legacy-signup' // Multi-step signup used from login page `Create account` click
    | 'single-page-signup' // Single page signup v1 - only used by vpn
    | 'single-page-signup-vpn'; // Single page signup v2 - used by all other products

export const sendSignupLoadTelemetry = ({
    planIDs,
    flowId,
    productIntent,
    currency,
    cycle,
}: {
    planIDs: PlanIDs;
    flowId: FlowId;
    productIntent: APP_NAMES | undefined;
    currency: Currency;
    cycle: CYCLE;
}) => {
    const selectedPlan = getPlanNameFromIDs(planIDs) || PLANS.FREE;

    telemetry.sendCustomEvent('signup_page_load_v1', {
        selectedPlan,
        flowId,
        productIntent: productIntent || 'generic',
        currency,
        cycle,
    });
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
    productIntent: APP_NAMES | undefined;
    currency: Currency;
    cycle: CYCLE;
    signupType: SignupType | undefined;
    amount: number;
}) => {
    const selectedPlan = getPlanNameFromIDs(planIDs) || PLANS.FREE;

    telemetry.sendCustomEvent('signup_account_creation_v1', {
        selectedPlan,
        flowId,
        productIntent: productIntent || 'generic',
        currency,
        cycle,
        signupType,
        amount,
    });
};
