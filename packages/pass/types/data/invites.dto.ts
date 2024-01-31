import type { KeyRotationKeyPair } from '@proton/pass/types/api';
import type { ShareRole } from '@proton/pass/types/data/shares';

export type NewUserInvitePromoteIntent = { newUserInviteId: string; shareId: string };
export type NewUserInviteRemoveIntent = { newUserInviteId: string; shareId: string };

export type InviteUserDTO = { email: string; publicKey: string; role: ShareRole };
export type InviteNewUserDTO = Omit<InviteUserDTO, 'publicKey'>;
export type InviteMemberDTO = InviteUserDTO | InviteNewUserDTO;

export type InviteBatchCreateIntent = { shareId: string; users: InviteUserDTO[]; newUsers: InviteNewUserDTO[] };
export type InviteBatchCreateSuccess = { shareId: string };

export type InviteResendIntent = { shareId: string; inviteId: string };
export type InviteRemoveIntent = { shareId: string; inviteId: string };

export type InviteRejectIntent = { inviteToken: string };
export type InviteAcceptIntent = {
    invitedAddressId: string;
    inviteKeys: KeyRotationKeyPair[];
    inviterEmail: string;
    inviteToken: string;
};
