import type { AccessDTO, AccessKeys } from '@proton/pass/lib/access/types';
import type { InviteData } from '@proton/pass/lib/invites/invite.requests';
import type { ItemRevision } from '@proton/pass/types/data/items';
import type { Share, ShareRole } from '@proton/pass/types/data/shares';
import type { MaybeNull } from '@proton/pass/types/utils';

export type InviteUserDTO = { email: string; publicKey: string; role: ShareRole };
export type InviteNewUserDTO = Omit<InviteUserDTO, 'publicKey'>;
export type InviteMemberDTO = InviteUserDTO | InviteNewUserDTO;

export type InviteBatchCreateSuccess = AccessKeys & { count: number };
export type NewUserInvitePromoteIntent = AccessDTO & { newUserInviteId: string };
export type NewUserInvitePromoteSuccess = AccessKeys & InviteData;
export type NewUserInviteRemoveIntent = AccessDTO & { newUserInviteId: string };
export type InviteResendIntent = AccessDTO & { inviteId: string };
export type InviteRemoveIntent = AccessDTO & { inviteId: string };

export type InviteRejectIntent = { inviteToken: string };
export type InviteAcceptIntent = { invitedAddressId: string; inviterEmail: string; inviteToken: string };
export type InviteAcceptSuccess = { inviteToken: string; share: Share; items: ItemRevision[] };

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
