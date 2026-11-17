import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { editMemberInvitation, inviteMember, updateAI, updateLumo } from '@proton/shared/lib/api/members';
import { VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import noop from '@proton/utils/noop';

import type { KtState } from '../kt';
import type { MemberState } from '../member';
import { organizationThunk } from '../organization';
import type { OrganizationKeyState } from '../organizationKey';
import { resetSelfVpnConnectionsHelper } from './actions';
import { getMember } from './getMember';
import { type MembersState, membersThunk, upsertMember } from './index';

interface InviteMemberPayload {
    email: string;
    storage: number;
    numAI: boolean | undefined;
    lumo: boolean | undefined;
    vpn: boolean | undefined;
}
export const createInvite = ({
    email,
    storage,
    numAI,
    lumo,
    vpn,
}: InviteMemberPayload): ThunkAction<
    Promise<void>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        if (vpn) {
            const [members, organization] = await Promise.all([
                dispatch(membersThunk()),
                dispatch(organizationThunk()),
            ]);
            await resetSelfVpnConnectionsHelper({ api: extra.api, members, organization }).catch(noop);
        }
        const { Member } = await extra.api<{ Member: Member }>(
            inviteMember({
                email,
                maxSpace: storage,
                // eslint-disable-next-line no-nested-ternary
                maxAI: numAI === undefined ? undefined : numAI ? 1 : 0,
                // eslint-disable-next-line no-nested-ternary
                maxLumo: lumo === undefined ? undefined : lumo ? 1 : 0,
                // eslint-disable-next-line no-nested-ternary
                maxVPN: vpn === undefined ? undefined : vpn ? VPN_CONNECTIONS : 0,
            })
        );
        dispatch(upsertMember({ member: Member }));
        dispatch(organizationThunk({ cache: CacheType.None })).catch(noop);
    };
};

export const editInvite = ({
    member,
    memberDiff,
}: {
    member: Member;
    memberDiff: Partial<InviteMemberPayload>;
}): ThunkAction<
    Promise<{ member: Member; diff: boolean }>,
    KtState & MemberState & MembersState & OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const api = extra.api;
        let diff = false;
        if (memberDiff.storage !== undefined || memberDiff.vpn !== undefined) {
            if (memberDiff.vpn) {
                const [members, organization] = await Promise.all([
                    dispatch(membersThunk()),
                    dispatch(organizationThunk()),
                ]);
                await resetSelfVpnConnectionsHelper({ api, members, organization }).catch(noop);
            }
            await api(
                editMemberInvitation(
                    member.ID,
                    // MaxSpace is required by the API, so the current value is sent when only the VPN access changed
                    memberDiff.storage ?? member.MaxSpace,
                    // eslint-disable-next-line no-nested-ternary
                    memberDiff.vpn === undefined ? undefined : memberDiff.vpn ? VPN_CONNECTIONS : 0
                )
            );
            diff = true;
        }
        if (memberDiff.numAI !== undefined) {
            await api(updateAI(member.ID, memberDiff.numAI ? 1 : 0));
            diff = true;
        }
        if (memberDiff.lumo !== undefined) {
            await api(updateLumo(member.ID, memberDiff.lumo ? 1 : 0));
            diff = true;
        }
        if (diff) {
            const [updatedMember] = await Promise.all([
                getMember(api, member.ID),
                // Upserting the member also has an effect on the org values, so they need to be updated too.
                dispatch(organizationThunk({ cache: CacheType.None })),
            ]);
            dispatch(upsertMember({ member: updatedMember }));
            return { member: updatedMember, diff: true };
        }
        return { member, diff: false };
    };
};
