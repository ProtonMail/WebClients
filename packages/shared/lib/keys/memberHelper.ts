import { type Member, MemberUnprivatizationState } from '../interfaces';

export const getHasMemberUnprivatization = (
    member?: Member
): member is Member & { Unprivatization: NonNullable<Member['Unprivatization']> } => {
    return Boolean(member && member.Unprivatization);
};

export const getIsMemberSetup = (member?: Member) => {
    return Boolean(member?.PublicKey);
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
            pending: member.Unprivatization.State === MemberUnprivatizationState.Pending,
            mode: (() => {
                const isMemberSetup = getIsMemberSetup(member);
                if (isMemberSetup) {
                    return MemberUnprivatizationMode.AdminAccess;
                }
                if (member.SSO) {
                    return MemberUnprivatizationMode.GSSO;
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
