import { UnknownAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { unprivatizeMemberKeysRoute } from '@proton/shared/lib/api/members';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Api, Member, MemberReadyForUnprivatization, VerifyOutboundPublicKeys } from '@proton/shared/lib/interfaces';
import { getMemberReadyForUnprivatization, getSentryError, unprivatizeMember } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { MembersState, getMemberAddresses, membersThunk } from './index';

const ephemeralState = {
    running: false,
    ignore: new Set(),
};

export const getMembersToUnprivatize = (members?: Member[]): MemberReadyForUnprivatization[] => {
    return (
        members?.filter((member): member is MemberReadyForUnprivatization =>
            getMemberReadyForUnprivatization(member.Unprivatization)
        ) || []
    );
};

export const unprivatizeMembers = ({
    verifyOutboundPublicKeys,
    api: normalApi,
}: {
    api: Api;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
}): ThunkAction<Promise<void>, MembersState & OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        if (ephemeralState.running) {
            return;
        }
        ephemeralState.running = true;
        const api = getSilentApi(normalApi);
        const members = await dispatch(membersThunk());
        const membersToUnprivatize = getMembersToUnprivatize(members);
        const organizationKey = await dispatch(organizationKeyThunk());
        if (!membersToUnprivatize?.length || !organizationKey?.privateKey) {
            ephemeralState.running = false;
            return;
        }
        const failedMembers: Member[] = [];
        const successfulMembers: Member[] = [];
        try {
            extra.eventManager.stop();

            for (const member of membersToUnprivatize) {
                try {
                    // Fetch org key again to ensure it's up-to-date.
                    const organizationKey = await dispatch(organizationKeyThunk());
                    const memberAddresses = await dispatch(getMemberAddresses({ member, retry: true }));
                    const payload = await unprivatizeMember({
                        api,
                        member,
                        memberAddresses,
                        organizationKey: organizationKey.privateKey,
                        verifyOutboundPublicKeys,
                    });
                    await api(unprivatizeMemberKeysRoute(member.ID, payload));
                    await successfulMembers.push(member);
                } catch (e) {
                    failedMembers.push(member);

                    const error = getSentryError(e);
                    if (error) {
                        captureMessage('Unprivatization: Error unprivatizing member', {
                            level: 'error',
                            extra: { error },
                        });
                    }
                }
            }
        } catch {
        } finally {
            failedMembers.forEach((member) => {
                ephemeralState.ignore.add(member.ID);
            });
            ephemeralState.running = false;
            extra.eventManager.start();
            if (successfulMembers.length) {
                await extra.eventManager.call().catch(noop);
            }
        }
    };
};
