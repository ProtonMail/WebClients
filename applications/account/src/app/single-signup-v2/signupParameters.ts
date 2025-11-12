import type * as H from 'history';

import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments';
import { getIsPassApp } from '@proton/shared/lib/authentication/apps';
import { getReturnUrlParameter } from '@proton/shared/lib/authentication/returnUrl';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import type { InviteData } from '../signup/interfaces';
import { getSignupSearchParams } from '../signup/searchParams';
import { SignupMode, type SignupParameters2 } from './interface';

export const getSignupParameters = ({
    toApp,
    initialSearchParams,
    visionarySignupEnabled,
    location,
    partner,
}: {
    toApp?: APP_NAMES;
    initialSearchParams?: URLSearchParams;
    visionarySignupEnabled: boolean;
    location: H.Location<{ invite?: InviteData }>;
    partner?: 'porkbun';
}): SignupParameters2 => {
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
            result.noPromo = true;
        }

        if (slEmail) {
            mode = SignupMode.PassSimpleLogin;
            localID = -1;
            invite = {
                type: 'pass',
                data: { invitee: emailUnspecified ? '' : slEmail },
            };
            result.noPromo = true;
        }
    }

    if (toApp === APPS.PROTONLUMO && preVerifiedAddressToken) {
        const email = result.email;
        if (email) {
            mode = SignupMode.Invite;
            localID = -1;
            invite = {
                type: 'lumo',
                data: {
                    invitee: email,
                    preVerifiedAddressToken,
                },
            };
            result.preSelectedPlan = PLANS.FREE;
            result.noPromo = true;
        }
    }

    const signIn: SignupParameters2['signIn'] = 'standard';

    if (partner === 'porkbun') {
        const preVerifiedAddressToken = searchParams.get('jwt') || undefined; // May be undefined in login scenario
        const porkbunToken = searchParams.get('token') || undefined;
        const email = searchParams.get('email') || undefined;
        if (email && porkbunToken) {
            return {
                ...result,
                localID: -1,
                signIn,
                mode: SignupMode.Invite,
                noPromo: true,
                invite: {
                    type: 'porkbun',
                    data: {
                        invitee: email,
                        preVerifiedAddressToken,
                        porkbunToken,
                    },
                },
                preSelectedPlan: PLANS.FREE,
                coupon: COUPON_CODES.PORKBUN,
                isMailVariantB: false,
            };
        }
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
        result.noPromo = true;
    } else if (
        // This defaults to the free plan if the user is coming from a proton drive link (based on the return url parameter).
        // This is a heuristic to guess that we are in the "save for later" flow with drive where product has requested to
        // default to a simple signup flow with the free plan without any promotions
        toApp === APPS.PROTONDRIVE &&
        initialSearchParams &&
        getReturnUrlParameter(initialSearchParams) &&
        (!result.preSelectedPlan || result.preSelectedPlan === 'free')
    ) {
        localID = -1;
        result.preSelectedPlan = PLANS.FREE;
        result.noPromo = true;
    }

    if (result.referrer) {
        mode = SignupMode.MailReferral;
        localID = -1;
        result.cycle = CYCLE.MONTHLY;
        result.hideFreePlan = false;
        result.noPromo = true;

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
        result.noPromo = true;
        invite = {
            type: 'generic',
            data: {
                selector: location.state.invite.selector,
                token: location.state.invite.token,
            },
        };
    }

    const isMailVariantB = toApp === APPS.PROTONMAIL && searchParams.get('v') === 'b';

    return {
        ...result,
        localID: Number.isInteger(localID) ? localID : undefined,
        signIn,
        mode,
        invite,
        isMailVariantB,
    };
};
