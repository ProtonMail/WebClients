import type {
    Member,
    MemberInvitationData,
    MemberReadyForAutomaticUnprivatization,
    MemberReadyForManualUnprivatization,
    MemberUnprivatization,
    MemberUnprivatizationAcceptState,
    MemberUnprivatizationAutomaticApproveState,
    MemberUnprivatizationManualApproveState,
} from '@proton/shared/lib/interfaces';
import { MemberUnprivatizationState } from '@proton/shared/lib/interfaces';
import { getIsMemberSetup } from '@proton/shared/lib/keys/memberHelper';

export const parseInvitationData = (data: string): MemberInvitationData => {
    return JSON.parse(data);
};

const getHasMemberUnprivatization = (
    member?: Member
): member is Member & { Unprivatization: NonNullable<Member['Unprivatization']> } => {
    return Boolean(member && member.Unprivatization);
};

export enum MemberUnprivatizationMode {
    None = 0,
    MagicLinkInvite = 1,
    GSSO = 2,
    AdminAccess = 3,
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

const getIsMemberUnprivatizationInAutomaticApproveState = (
    unprivatizationData: MemberUnprivatization | null
): unprivatizationData is MemberUnprivatizationAutomaticApproveState => {
    return Boolean(
        unprivatizationData?.State === MemberUnprivatizationState.Ready &&
        !unprivatizationData.PrivateIntent &&
        unprivatizationData.InvitationData &&
        unprivatizationData.InvitationSignature &&
        unprivatizationData.ActivationToken &&
        (unprivatizationData.PrivateKeys?.length || 0) > 0
    );
};

const getIsMemberUnprivatizationInManualApproveState = (
    unprivatizationData: MemberUnprivatization | null
): unprivatizationData is MemberUnprivatizationManualApproveState => {
    return Boolean(
        unprivatizationData?.State === MemberUnprivatizationState.Ready &&
        !unprivatizationData.PrivateIntent &&
        !unprivatizationData.InvitationData &&
        !unprivatizationData.InvitationSignature &&
        unprivatizationData.ActivationToken &&
        (unprivatizationData.PrivateKeys?.length || 0) > 0
    );
};

const getIsMemberUnprivatizationInManualAcceptState = (
    unprivatizationData: MemberUnprivatization | null
): unprivatizationData is MemberUnprivatizationAcceptState => {
    return Boolean(
        unprivatizationData?.State === MemberUnprivatizationState.Pending &&
        !unprivatizationData.PrivateIntent &&
        unprivatizationData.InvitationData &&
        unprivatizationData.InvitationSignature &&
        !unprivatizationData.ActivationToken &&
        !unprivatizationData.PrivateKeys?.length
    );
};

export const getIsMemberInAutomaticApproveState = (
    member: Member
): member is MemberReadyForAutomaticUnprivatization => {
    return getIsMemberUnprivatizationInAutomaticApproveState(member.Unprivatization);
};

export const getIsMemberInManualApproveState = (member: Member): member is MemberReadyForManualUnprivatization => {
    return getIsMemberUnprivatizationInManualApproveState(member.Unprivatization);
};

export const getIsMemberInManualAcceptState = (member: Member): member is MemberReadyForManualUnprivatization => {
    return getIsMemberUnprivatizationInManualAcceptState(member.Unprivatization);
};
