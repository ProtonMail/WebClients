import { type CYCLE, type Currency, type PLANS } from '@proton/payments/index';
import { type APP_NAMES } from '@proton/shared/lib/constants';
import { telemetry } from '@proton/shared/lib/telemetry';

import type { SignupType } from './interfaces';

type FlowId =
    | 'legacy-signup' // Multi-step signup used from login page `Create account` click
    | 'single-page-signup' // Single page signup v1 - only used by vpn
    | 'single-page-signup-vpn'; // Single page signup v2 - used by all other products

export const sendSignupLoadTelemetry = ({
    plan,
    flowId,
    productIntent,
    currency,
    cycle,
}: {
    plan: PLANS;
    flowId: FlowId;
    productIntent: APP_NAMES | undefined;
    currency: Currency;
    cycle: CYCLE;
}) => {
    telemetry.sendCustomEvent('signup_page_load_v1', {
        selectedPlan: plan,
        flowId,
        productIntent: productIntent || 'generic',
        currency,
        cycle,
    });
};

export const sendSignupAccountCreationTelemetry = ({
    plan,
    flowId,
    productIntent,
    currency,
    cycle,
    signupType,
    amount,
}: {
    plan: PLANS;
    flowId: FlowId;
    productIntent: APP_NAMES | undefined;
    currency: Currency;
    cycle: CYCLE;
    signupType: SignupType | undefined;
    amount: number;
}) => {
    telemetry.sendCustomEvent('signup_account_creation_v1', {
        selectedPlan: plan,
        flowId,
        productIntent: productIntent || 'generic',
        currency,
        cycle,
        signupType,
        amount,
    });
};
