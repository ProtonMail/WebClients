import { MEMBER_STATE, type Member, MemberUnprivatizationState } from '../interfaces';

export const getHasMemberUnprivatization = (
    member?: Member
): member is Member & { Unprivatization: NonNullable<Member['Unprivatization']> } => {
    return Boolean(member && member.Unprivatization);
};

export const getIsMemberSetup = (member?: Member): member is Member => {
    return Boolean(member?.PublicKey);
};

export const getIsMemberInactive = (member?: Member): member is Member & { State: MEMBER_STATE.STATUS_DISABLED } => {
    return member?.State === MEMBER_STATE.STATUS_DISABLED;
};

export enum MemberUnprivatizationMode {
    None,
    MagicLinkInvite,
    GSSO,
    AdminAccess,
}

export const getMemberUnprivatizationMode = (member?: Member) => {
    if (getHasMemberUnprivatization(member)) {
        return {
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
        exists: false,
        mode: MemberUnprivatizationMode.None,
        pending: false,
    };
};

export const getMemberEmailOrName = (member: Member) => {
    return member.Addresses?.[0]?.Email || member.Name || '';
};
