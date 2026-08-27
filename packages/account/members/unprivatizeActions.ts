import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { createEntitlementResolver } from '@proton/payments/core/entitlements/resolver';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import {
    deleteUnprivatizationRequest,
    requestUnprivatization as requestUnprivatizationConfig,
    unprivatizeMemberKeysRoute,
} from '@proton/shared/lib/api/members';
import { MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { captureMessage, getSentryError } from '@proton/shared/lib/helpers/sentry';
import type { Api, KTUserContext, Member, MemberReadyForAutomaticUnprivatization } from '@proton/shared/lib/interfaces';
import {
    getInvitationData,
    getIsMemberInAutomaticApproveState,
    getIsMemberInManualAcceptState,
    getSignedInvitationData,
    getUnprivatizeMemberPayload,
} from '@proton/shared/lib/keys';
import { getIsMemberSetup } from '@proton/shared/lib/keys/memberHelper';
import noop from '@proton/utils/noop';

import { type EntitlementsState, entitlementsThunk } from '../entitlements';
import type { KtState } from '../kt';
import { getKTUserContext } from '../kt/actions';
import { type MemberState, memberThunk } from '../member';
import { getPendingUnprivatizationRequest, memberAcceptUnprivatization } from '../member/actions';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import { MemberCreationValidationError, type MembersState, getMemberAddresses } from './index';

export const unprivatizeMember = ({
    member,
    ktUserContext,
    options,
    api,
}: {
    member: MemberReadyForAutomaticUnprivatization;
    ktUserContext: KTUserContext;
    options?: Parameters<typeof getUnprivatizeMemberPayload>[0]['options'];
    api: Api;
}): ThunkAction<
    Promise<void>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [userKeys, organizationKey, memberAddresses] = await Promise.all([
            dispatch(userKeysThunk()),
            dispatch(organizationKeyThunk()), // Fetch org key again to ensure it's up-to-date.
            dispatch(getMemberAddresses({ member, retry: true })),
        ]);
        const payload = await getUnprivatizeMemberPayload({
            api,
            member,
            memberAddresses,
            organizationKey,
            userKeys,
            ktUserContext,
            options,
        });
        await api(unprivatizeMemberKeysRoute(member.ID, payload));
        if (member.Self) {
            await Promise.all([
                dispatch(userThunk({ cache: CacheType.None })),
                dispatch(memberThunk({ cache: CacheType.None })),
            ]).catch(noop);
        }
    };
};
export const requestUnprivatization = ({
    api,
    member,
    makeAdmin,
}: {
    api: Api;
    member: Member;
    makeAdmin?: boolean;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
        if (!organizationKey?.privateKey) {
            throw new MemberCreationValidationError(
                c('unprivatization').t`Organization key must be activated to request data access`
            );
        }
        const memberAddresses = await dispatch(getMemberAddresses({ member, retry: true }));
        const primaryEmailAddress = memberAddresses?.[0].Email;
        if (!primaryEmailAddress) {
            throw new MemberCreationValidationError(
                c('unprivatization').t`The user must have an address to request data access`
            );
        }
        // If the member don't have keys setup, it's only allowed to pass-through for SSO members.
        // This is because those members get into the global SSO password setup flow on next login.
        // For regular members, there's the join magic link flow, however that is not triggered
        // for those members signing in.
        if (!member.SSO && !getIsMemberSetup(member)) {
            throw new MemberCreationValidationError(c('unprivatization').t`Member activation incomplete`);
        }
        const invitationData = await getInvitationData({
            api,
            address: primaryEmailAddress,
            expectRevisionChange: false,
            admin: makeAdmin ? true : undefined,
        });
        const invitationSignature = await getSignedInvitationData(organizationKey.privateKey, invitationData);
        await api(
            requestUnprivatizationConfig(member.ID, {
                InvitationData: invitationData,
                InvitationSignature: invitationSignature,
            })
        );
    };
};

export const unprivatizeSelf = ({
    api,
    member: initialMember,
}: {
    api: Api;
    member: Member;
}): ThunkAction<
    Promise<void>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        try {
            let member = initialMember;

            if (
                !member.Self ||
                member.Private !== MEMBER_PRIVATE.UNREADABLE ||
                member.Role !== MEMBER_ROLE.ORGANIZATION_ADMIN
            ) {
                throw new Error('Can only be used for private self admins');
            }

            // Stop the event manager to prevent the background unprivatization kicking in
            // This operation should just be run in this context alone
            extra.eventManager.stop();

            if (!member.Unprivatization) {
                await dispatch(requestUnprivatization({ member, api }));
                member = await dispatch(memberThunk({ cache: CacheType.None }));
            }

            if (getIsMemberInManualAcceptState(member)) {
                // Fetch the unprivatization data (self) and accept it
                const pendingData = await dispatch(getPendingUnprivatizationRequest({ member }));

                if (!pendingData) {
                    throw new Error('Unable to get pending unprivatization for self');
                }

                await dispatch(
                    memberAcceptUnprivatization({
                        api,
                        member,
                        parsedUnprivatizationData: pendingData.parsedUnprivatizationData,
                    })
                );

                // Fetch the member again to get the updated values and finalize the unprivatization
                member = await dispatch(memberThunk({ cache: CacheType.None }));
            }

            if (getIsMemberInAutomaticApproveState(member)) {
                const ktUserContext = await dispatch(getKTUserContext());
                await dispatch(unprivatizeMember({ member, api, ktUserContext }));
            } else {
                throw new Error('Unable to finalize self unprivatization');
            }
        } finally {
            extra.eventManager.start();
        }
    };
};

/**
 * MSP organizations manage subsidiaries with the organization key, which requires the administrator's
 * own keys to be accessible through it. Meant to run as a post-step to organization key creation, so
 * failures are reported but never rethrown: the key already exists by the time this runs, and
 * rejecting would leave callers retrying creation against an organization that already has keys. The
 * admin can still be unprivatized later on from the members list.
 */
export const unprivatizeSelfForMsp = ({
    api,
}: {
    api: Api;
}): ThunkAction<
    Promise<void>,
    KtState & MemberState & MembersState & OrganizationKeyState & EntitlementsState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        try {
            const entitlements = createEntitlementResolver(await dispatch(entitlementsThunk({ api })));
            if (!entitlements.orgIsMspEligible) {
                return;
            }
            const member = await dispatch(memberThunk({ cache: CacheType.None }));
            if (member?.Private === MEMBER_PRIVATE.UNREADABLE && member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
                await dispatch(unprivatizeSelf({ member, api }));
            }
        } catch (error) {
            const sentryError = getSentryError(error);
            if (sentryError) {
                captureMessage('MSP: Error unprivatizing self on organization key creation', {
                    level: 'error',
                    extra: { error: sentryError },
                });
            }
        }
    };
};

export const deleteRequestUnprivatization = ({
    api,
    member,
}: {
    api: Api;
    member: Member;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async () => {
        if (member.Unprivatization === null) {
            return;
        }
        await api(deleteUnprivatizationRequest(member.ID));
    };
};
