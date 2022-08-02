import { PaymentParameters } from '@proton/components/containers/payments/interface';
import { handlePaymentToken } from '@proton/components/containers/payments/paymentTokenHelper';
import { checkSubscription } from '@proton/shared/lib/api/payments';
import { PLAN_TYPES } from '@proton/shared/lib/constants';
import { getEmailParts, removePlusAliasLocalPart } from '@proton/shared/lib/helpers/email';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { Api, Currency, Cycle, Plan, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';

import { PlanIDs } from './interfaces';

export const getCardPayment = async ({
    api,
    createModal,
    currency,
    checkResult,
    paymentParameters,
}: {
    createModal: (modal: JSX.Element) => void;
    api: Api;
    currency: string;
    paymentParameters: PaymentParameters;
    checkResult: SubscriptionCheckResponse;
}) => {
    return handlePaymentToken({
        params: {
            ...paymentParameters,
            Amount: checkResult.AmountDue,
            Currency: currency,
        },
        api,
        createModal,
        mode: '',
    });
};

export const getSubscriptionPrices = async (
    api: Api,
    planIDs: PlanIDs,
    currency: Currency,
    cycle: Cycle,
    couponCode?: string
) => {
    if (!hasPlanIDs(planIDs)) {
        return getFreeCheckResult(currency, cycle);
    }
    return api<SubscriptionCheckResponse>(
        checkSubscription({
            Plans: planIDs,
            Currency: currency,
            Cycle: cycle,
            CouponCode: couponCode,
        })
    );
};

export const getPlanFromPlanIDs = (plans: Plan[], planIDs?: PlanIDs) => {
    const planIDsList = Object.keys(planIDs || {});
    return plans.find(({ Name, Type }) => Type === PLAN_TYPES.PLAN && planIDsList.includes(Name));
};

export const getLocalPart = (email: string) => {
    const [localPart] = getEmailParts(email);
    return removePlusAliasLocalPart(localPart);
};
