// get a list of your own referrals with pagination and filters (state) query parameters

import { ReferralState } from '../../interfaces/Referrals';

interface GetReferralsProps {
    page: number;
    state?: ReferralState;
}
export const getReferrals = ({ page }: GetReferralsProps) => ({
    method: 'get',
    url: 'core/v4/referrals',
    params: { Page: page },
});

/**
 * Get current user referral status
 */
export const getReferralsStatus = () => ({
    method: 'get',
    url: 'core/v4/referrals/status',
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
