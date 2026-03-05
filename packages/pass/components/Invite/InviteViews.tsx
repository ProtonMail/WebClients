import type { FC } from 'react';

import { GroupsProvider } from '@proton/pass/components/Groups/GroupsProvider';
import { InviteError } from '@proton/pass/components/Invite/InviteError';
import type { InviteContextState } from '@proton/pass/components/Invite/InviteProvider';
import { ItemAccessManager } from '@proton/pass/components/Invite/Item/ItemAccessManager';
import { ItemInviteCreate } from '@proton/pass/components/Invite/Item/ItemInviteCreate';
import { ItemInviteRespond } from '@proton/pass/components/Invite/Item/ItemInviteRespond';
import { VaultAccessManager } from '@proton/pass/components/Invite/Vault/VaultAccessManager';
import { VaultInviteCreate } from '@proton/pass/components/Invite/Vault/VaultInviteCreate';
import { VaultInviteRespond } from '@proton/pass/components/Invite/Vault/VaultInviteRespond';
import type { Invite, MaybeNull } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';

type Props = {
    inviteState: MaybeNull<InviteContextState>;
    invite: MaybeNull<Invite>;
    onError: () => void;
};

export const InviteViews: FC<Props> = ({ inviteState, invite, onError }) => {
    if (!inviteState && !invite) return null;

    return (
        <InviteError onError={onError}>
            {/* GroupsProvider is loaded only once it's required because it triggers a costly request to get all groups */}
            <GroupsProvider>
                {inviteState?.view === 'invite-item' && (
                    <ItemInviteCreate shareId={inviteState.shareId} itemId={inviteState.itemId} />
                )}
                {inviteState?.view === 'invite-vault' && <VaultInviteCreate shareId={inviteState.shareId} />}
                {inviteState?.view === 'manage-item' && (
                    <ItemAccessManager shareId={inviteState.shareId} itemId={inviteState.itemId} />
                )}
                {inviteState?.view === 'manage-vault' && <VaultAccessManager shareId={inviteState.shareId} />}
                {invite?.targetType === ShareType.Vault && <VaultInviteRespond token={invite.token} />}
                {invite?.targetType === ShareType.Item && <ItemInviteRespond token={invite.token} />}
            </GroupsProvider>
        </InviteError>
    );
};
