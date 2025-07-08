import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { MembersState } from '@proton/account/members';
import { unprivatizeMembersManual } from '@proton/account/members/unprivatizeMembers';
import type { OrganizationState } from '@proton/account/organization';
import type { OrganizationKeyState } from '@proton/account/organizationKey/index';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { revoke } from '@proton/shared/lib/api/auth';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { authMember } from '@proton/shared/lib/api/members';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import {
    type ResumedSessionResult,
    maybeResumeSessionByUser,
    persistSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Member } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper, getIsMemberInManualApproveState } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { getOrganizationTokenThunk } from './actions';

export const accessMemberThunk = ({
    member: initialMember,
}: {
    member: Member;
}): ThunkAction<
    Promise<ResumedSessionResult>,
    OrganizationState & OrganizationKeyState & MembersState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        let member = initialMember;
        const silentApi = getSilentApi(extra.api);

        // If the member needs to get unprivatized, let's do it first
        if (getIsMemberInManualApproveState(member)) {
            const [updatedMember] = await dispatch(unprivatizeMembersManual({ membersToUnprivatize: [member] }));
            if (updatedMember) {
                member = updatedMember;
            }
        }

        const { UID, LocalID } = await silentApi<{ UID: string; LocalID: number }>(authMember(member.ID));

        if (!UID || !LocalID) {
            throw new Error('Failed to get auth data');
        }

        const memberApi = getUIDApi(UID, silentApi);
        const accessUser = await getUser(memberApi);

        const validatedSession = await maybeResumeSessionByUser({
            api: silentApi,
            User: accessUser,
            // During proton login, ignore resuming an oauth session
            options: { source: [SessionSource.Proton, SessionSource.Saml] },
        });
        if (validatedSession) {
            memberApi(revoke()).catch(noop);
            return validatedSession;
        }

        const keyPassword = await dispatch(getOrganizationTokenThunk());

        const decryptedKeys = await getDecryptedUserKeysHelper(accessUser, keyPassword);
        if (!decryptedKeys.length) {
            throw new Error('Unable to decrypt user keys with organization key');
        }

        const session = await persistSession({
            api: memberApi,
            keyPassword,
            User: accessUser,
            LocalID,
            UID,
            // Signing into subuser doesn't need offline mode support
            clearKeyPassword: '',
            offlineKey: undefined,
            persistent: extra.authentication.getPersistent(),
            trusted: false,
            source: SessionSource.Proton,
        });

        return session;
    };
};
