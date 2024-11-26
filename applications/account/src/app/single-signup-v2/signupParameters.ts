import type * as H from 'history';

import { PLANS } from '@proton/payments/core/constants';
import { getIsPassApp } from '@proton/shared/lib/authentication/apps';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, CYCLE, REFERRER_CODE_MAIL_TRIAL } from '@proton/shared/lib/constants';

import type { InviteData } from '../signup/interfaces';
import { getSignupSearchParams } from '../signup/searchParams';
import { SignupMode, type SignupParameters2 } from './interface';

export const getSignupParameters = ({
    toApp,
    initialSearchParams,
    visionarySignupEnabled,
    location,
    isMailTrial,
}: {
    toApp?: APP_NAMES;
    initialSearchParams?: URLSearchParams;
    visionarySignupEnabled: boolean;
    location: H.Location<{ invite?: InviteData }>;
    isMailTrial?: boolean;
}) => {
    const searchParams = new URLSearchParams(location.search);
    if (toApp !== APPS.PROTONWALLET && !visionarySignupEnabled && searchParams.get('plan') === PLANS.VISIONARY) {
        searchParams.delete('plan');
    }
    const result = getSignupSearchParams(location.pathname, searchParams);
    if (!result.email && initialSearchParams) {
        result.email = initialSearchParams.get('email') || result.email;
    }

    let localID = Number(searchParams.get('u') || undefined);
    let mode = SignupMode.Default;

    // pass new user invite
    const inviter = searchParams.get('inviter');
    const invitee = searchParams.get('invitee') || searchParams.get('invited');
    let invite: SignupParameters2['invite'] = undefined;

    const preVerifiedAddressToken = searchParams.get('preVerifiedAddressToken') || undefined;

    // pass from simplelogin
    const slEmail = searchParams.get('slEmail');
    const emailUnspecified = slEmail === 'unspecified';

    if (getIsPassApp(toApp)) {
        if (invitee && inviter) {
            mode = SignupMode.Invite;
            localID = -1;
            invite = {
                type: 'pass',
                data: { inviter, invitee, preVerifiedAddressToken },
            };
        }

        if (slEmail) {
            mode = SignupMode.PassSimpleLogin;
            localID = -1;
            invite = {
                type: 'pass',
                data: { invitee: emailUnspecified ? '' : slEmail },
            };
        }
    }

    let signIn: SignupParameters2['signIn'] = 'standard';

    if (isMailTrial) {
        result.referrer = REFERRER_CODE_MAIL_TRIAL;
    }

    const externalInvitationID = searchParams.get('externalInvitationID');
    const email = result.email;
    if (toApp === APPS.PROTONDRIVE && externalInvitationID && email && preVerifiedAddressToken) {
        mode = SignupMode.Invite;
        localID = -1;
        invite = {
            type: 'drive',
            data: { invitee: email, externalInvitationID, preVerifiedAddressToken },
        };
        result.preSelectedPlan = PLANS.FREE;
    }

    if (toApp === APPS.PROTONWALLET && email && preVerifiedAddressToken) {
        mode = SignupMode.Invite;
        localID = -1;
        invite = {
            type: 'wallet',
            data: { invitee: email, preVerifiedAddressToken },
        };
        result.preSelectedPlan = PLANS.FREE;
    } else if (
        toApp === APPS.PROTONWALLET &&
        // If it's not visionary or wallet, force free selection
        !new Set([PLANS.VISIONARY, PLANS.WALLET]).has(result.preSelectedPlan as any)
    ) {
        // TODO: WalletEA
        result.preSelectedPlan = PLANS.FREE;
    }

    if (result.referrer) {
        mode = SignupMode.MailReferral;
        localID = -1;
        result.cycle = CYCLE.MONTHLY;
        result.hideFreePlan = false;

        invite = {
            type: 'mail',
            data: {
                referrer: result.referrer,
                invite: result.invite,
            },
        };
    }

    if (location.state?.invite) {
        mode = SignupMode.Default;
        localID = -1;
        result.hideFreePlan = false;
        invite = {
            type: 'generic',
            data: {
                selector: location.state.invite.selector,
                token: location.state.invite.token,
            },
        };
    }

    return {
        ...result,
        localID: Number.isInteger(localID) ? localID : undefined,
        signIn,
        mode,
        invite,
    };
};
