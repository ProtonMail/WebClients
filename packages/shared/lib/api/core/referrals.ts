import type { ReferralData } from '../../interfaces/referral';
import type { BillingAddress } from '../../payments/billing-address';
import type { CYCLE, PLANS } from '../../payments/constants';
import type { Currency, PlanIDs } from '../../payments/interface';

interface GetReferralsProps {
    Offset?: number;
    Limit?: number;
    b2c2b?: boolean;
}

export const getReferrals = (params?: GetReferralsProps) => ({
    method: 'get',
    url: 'core/v4/referrals',
    params: params,
});

/**
 * Get current user referral status
 */
export const getReferralsStatus = () => ({
    method: 'get',
    url: 'core/v4/referrals/status',
});

/**
 * Get referral info
 */
export const getReferralInfo = ({ b2c2b }: { b2c2b?: boolean } = {}) => ({
    method: 'get',
    url: 'core/v4/referrals/info',
    params: b2c2b ? { b2c2b } : undefined,
});

interface SendEmailInvationProps {
    emails: string[];
    b2c2b?: boolean;
}
export const sendEmailInvitation = ({ emails, b2c2b }: SendEmailInvationProps) => ({
    method: 'post',
    url: 'core/v4/referrals',
    params: b2c2b ? { b2c2b } : undefined,
    data: { Recipients: emails },
});

export const checkReferrer = (identifier: string) => ({
    method: 'get',
    url: `core/v4/referrals/identifiers/${identifier}`,
});

export interface ListEligibleTrialsResponse {
    TrialPlans: string[];
    CreditCardRequiredPlans: string[];
}

/**
 * List eligible trial plans for a referral identifier
 */
export const listEligibleTrials = (referralIdentifier: string) => ({
    method: 'get',
    url: `core/v4/trials/${referralIdentifier}`,
});

export interface ReferralRegistrationPlan {
    name: PLANS;
    cycle: CYCLE;
}

const getPlanData = (plan: ReferralRegistrationPlan | undefined) => {
    if (!plan) {
        return {};
    }

    return {
        Plan: plan.name,
        Cycle: plan.cycle,
    };
};

export interface ReferralRegistrationSubscription {
    paymentToken: string;
    billingAddress: BillingAddress;
    code?: string;
    currency?: Currency;
    planIDs?: PlanIDs;
}

export const postReferralRegistration = ({
    plan,
    referralData,
    referralRegistrationSubscription,
}: {
    plan: ReferralRegistrationPlan | undefined;
    referralData: ReferralData;
    referralRegistrationSubscription: ReferralRegistrationSubscription | undefined;
}) => ({
    method: 'post',
    url: `core/v4/referrals/register`,
    data: {
        ...getPlanData(plan),
        ReferralIdentifier: referralData.referralIdentifier,
        ReferralID: referralData.referralID,
        PaymentToken: referralRegistrationSubscription?.paymentToken,
        BillingAddress: referralRegistrationSubscription?.billingAddress,
        Codes: referralRegistrationSubscription?.code ? [referralRegistrationSubscription.code] : undefined,
        Currency: referralRegistrationSubscription?.currency,
        Plans: referralRegistrationSubscription?.planIDs,
    },
});
