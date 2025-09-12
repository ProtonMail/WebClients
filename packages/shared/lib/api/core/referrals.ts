import type { BillingAddress, CYCLE, PLANS } from '@proton/payments';

import type { ReferralData } from '../../interfaces';

interface GetReferralsProps {
    Offset?: number;
    Limit?: number;
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
export const getReferralInfo = () => ({
    method: 'get',
    url: 'core/v4/referrals/info',
});

interface SendEmailInvationProps {
    emails: string[];
}
export const sendEmailInvitation = ({ emails }: SendEmailInvationProps) => ({
    method: 'post',
    url: 'core/v4/referrals',
    data: { Recipients: emails },
});

interface ResendInvitationURLParams {
    id: string;
}
export const resendEmailInvitation = ({ id }: ResendInvitationURLParams) => ({
    method: 'get',
    url: `core/v4/referrals/${id}`,
});

interface DeleteInvitationURLParams {
    id: string;
}
/** delete an invitation or outdated referral */
export const deleteInvitation = ({ id }: DeleteInvitationURLParams) => ({
    method: 'delete',
    url: `core/v4/referrals/${id}`,
});

export const checkReferrer = (identifier: string) => ({
    method: 'get',
    url: `core/v4/referrals/identifiers/${identifier}`,
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
    },
});
