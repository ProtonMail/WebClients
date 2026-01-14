import { parseInvitationData } from '@proton/shared/lib/keys/unprivatization';

import { ADDRESS_STATUS } from '../constants';
import { canonicalizeInternalEmail } from '../helpers/email';
import {
    type EnhancedMember,
    MEMBER_STATE,
    type Member,
    type MemberInvitationData,
    MemberUnprivatizationState,
} from '../interfaces';

export const getHasMemberUnprivatization = (
    member?: Member
): member is Member & { Unprivatization: NonNullable<Member['Unprivatization']> } => {
    return Boolean(member && member.Unprivatization);
};

export const getIsMemberSetup = (member?: Member) => {
    return Boolean(member?.PublicKey);
};

export const getIsMemberDisabled = (member?: Member): member is Member & { State: MEMBER_STATE.STATUS_DISABLED } => {
    return member?.State === MEMBER_STATE.STATUS_DISABLED;
};

export const getIsMemberEnabled = (
    member?: Member
): member is Member & {
    State: MEMBER_STATE.STATUS_ENABLED;
} => {
    return member?.State === MEMBER_STATE.STATUS_ENABLED;
};

export const getIsMemberInvited = (
    member?: Member
): member is Member & {
    State: MEMBER_STATE.STATUS_INVITED;
} => {
    return member?.State === MEMBER_STATE.STATUS_INVITED;
};

export enum MemberUnprivatizationMode {
    None,
    MagicLinkInvite,
    GSSO,
    AdminAccess,
}

export const getMemberUnprivatizationMode = (member?: Member) => {
    if (getHasMemberUnprivatization(member)) {
        let invitationData: MemberInvitationData | null = null;
        try {
            const InvitationData = member.Unprivatization.InvitationData;
            invitationData = InvitationData ? parseInvitationData(InvitationData) : null;
        } catch {}
        return {
            makeAdmin: invitationData?.Admin === true,
            exists: true,
            pending:
                member.Unprivatization.State === MemberUnprivatizationState.Pending ||
                member.Unprivatization.State === MemberUnprivatizationState.Ready,
            mode: (() => {
                if (member.SSO) {
                    return MemberUnprivatizationMode.GSSO;
                }
                const isMemberSetup = getIsMemberSetup(member);
                if (isMemberSetup) {
                    return MemberUnprivatizationMode.AdminAccess;
                }
                return MemberUnprivatizationMode.MagicLinkInvite;
            })(),
        };
    }

    return {
        makeAdmin: false,
        exists: false,
        mode: MemberUnprivatizationMode.None,
        pending: false,
    };
};

export const getMemberEmailOrName = (member: Member) => {
    return member.Addresses?.[0]?.Email || member.Name || '';
};

export const getMemberByAddressId = (members: EnhancedMember[], addressID: string): EnhancedMember | undefined => {
    return members.find((member: EnhancedMember) => member.Addresses?.some((address) => address.ID === addressID));
};

export const getMemberByEmail = (members: EnhancedMember[], email: string): EnhancedMember | undefined => {
    const canonicalEmail = canonicalizeInternalEmail(email);

    return members.find((member) =>
        member.Addresses?.some((address) => {
            const isEnabled = address.Status === ADDRESS_STATUS.STATUS_ENABLED;
            const isCanonicalEmail = canonicalizeInternalEmail(address.Email) === canonicalEmail;
            return isEnabled && isCanonicalEmail;
        })
    );
};
