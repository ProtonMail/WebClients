import type { KeyRotationKeyPair } from '@proton/pass/types/api';
import type { ShareRole } from '@proton/pass/types/data/shares';
import type { MaybeNull } from '@proton/pass/types/utils';

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

export type InviteRecommendationsIntent = {
    pageSize: number;
    shareId: string;
    since: MaybeNull<string>;
    startsWith: string;
};

export type InviteRecommendationsSuccess = {
    startsWith: string;
    emails: string[];
    more: boolean;
    next: MaybeNull<string>;
    since: MaybeNull<string>;
    /** organization response should be null for free users */
    organization: MaybeNull<{
        emails: string[];
        name: string;
    }>;
};
