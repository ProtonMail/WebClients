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
    AdminAccess,
}

export const getMemberUnprivatizationMode = (member?: Member) => {
    const isMemberSetup = getIsMemberSetup(member);
    if (getHasMemberUnprivatization(member)) {
        return {
            exists: true,
            mode: isMemberSetup ? MemberUnprivatizationMode.AdminAccess : MemberUnprivatizationMode.MagicLinkInvite,
            pending: member.Unprivatization.State === MemberUnprivatizationState.Pending,
            isMemberSetup,
        };
    }
    return {
        exists: false,
        mode: MemberUnprivatizationMode.None,
        pending: false,
        isMemberSetup,
    };
};
