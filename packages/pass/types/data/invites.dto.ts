import type { ItemRevision, SelectedItem } from '@proton/pass/types/data/items';
import type { Share, ShareRole, ShareType } from '@proton/pass/types/data/shares';

import type { KeyRotationKeyPair } from '../api';

export type NewUserInvitePromoteIntent = { newUserInviteId: string; shareId: string };
export type NewUserInviteRemoveIntent = { newUserInviteId: string; shareId: string };

export type InviteCreateIntent = { shareId: string; email: string; role: ShareRole };
export type InviteCreateSuccess =
    | {
          item: SelectedItem;
          movedItem: ItemRevision;
          share: Share<ShareType.Vault>;
          shareId: string;
          withVaultCreation: true;
      }
    | { shareId: string; withVaultCreation: false };

export type InviteResendIntent = { shareId: string; inviteId: string };
export type InviteRemoveIntent = { shareId: string; inviteId: string };

export type InviteRejectIntent = { inviteToken: string };
export type InviteAcceptIntent = {
    invitedAddressId: string;
    inviteKeys: KeyRotationKeyPair[];
    inviterEmail: string;
    inviteToken: string;
};
