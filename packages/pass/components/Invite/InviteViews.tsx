import type { FC } from 'react';

import type { Invite, MaybeNull } from '../../types';
import { ShareType } from '../../types';
import { GroupsProvider } from '../Groups/GroupsProvider';
import type { InviteContextState } from './InviteContext';
import { InviteError } from './InviteError';
import { ItemAccessManager } from './Item/ItemAccessManager';
import { ItemInviteCreate } from './Item/ItemInviteCreate';
import { ItemInviteRespond } from './Item/ItemInviteRespond';
import { VaultAccessManager } from './Vault/VaultAccessManager';
import { VaultInviteCreate } from './Vault/VaultInviteCreate';
import { VaultInviteRespond } from './Vault/VaultInviteRespond';

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
