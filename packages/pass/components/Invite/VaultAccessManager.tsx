import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Prompt } from '@proton/components/components';
import { useInviteContext } from '@proton/pass/components/Invite/InviteContextProvider';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { ShareMember } from '@proton/pass/components/Share/ShareMember';
import { PendingExistingMember, PendingNewMember } from '@proton/pass/components/Share/SharePendingMember';
import { SharedVaultItem } from '@proton/pass/components/Vault/SharedVaultItem';
import { useShareAccessOptionsPolling } from '@proton/pass/hooks/useShareAccessOptionsPolling';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { isVaultMemberLimitReached } from '@proton/pass/lib/vaults/vault.predicates';
import { selectOwnWritableVaults, selectPassPlan, selectShareOrThrow } from '@proton/pass/store/selectors';
import type { NewUserPendingInvite, PendingInvite, ShareType } from '@proton/pass/types';
import { type ShareMember as ShareMemberType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { sortOn } from '@proton/pass/utils/fp/sort';

type Props = { shareId: string };

type InviteListItem =
    | { key: string; type: 'existing'; invite: PendingInvite }
    | { key: string; type: 'new'; invite: NewUserPendingInvite };

export const VaultAccessManager: FC<Props> = ({ shareId }) => {
    const { createInvite, close } = useInviteContext();
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const plan = useSelector(selectPassPlan);
    const loading = useShareAccessOptionsPolling(shareId);
    const canManage = isShareManageable(vault);
    const hasMultipleOwnedWritableVaults = useSelector(selectOwnWritableVaults).length > 1;
    const [limitModalOpen, setLimitModalOpen] = useState(false);

    const members = useMemo<ShareMemberType[]>(() => (vault.members ?? []).sort(sortOn('email', 'ASC')), [vault]);
    const invites = useMemo<InviteListItem[]>(
        () =>
            [
                ...(vault.invites ?? []).map((invite) => ({
                    key: invite.invitedEmail,
                    type: 'existing' as const,
                    invite,
                })),
                ...(vault.newUserInvites ?? []).map((invite) => ({
                    key: invite.invitedEmail,
                    type: 'new' as const,
                    invite,
                })),
            ].sort(sortOn('key', 'ASC')),
        [vault]
    );

    const memberLimitReached = isVaultMemberLimitReached(vault);

    const warning = (() => {
        if (canManage && memberLimitReached) {
            const upgradeLink = <UpgradeButton inline label={c('Action').t`Upgrade now to share with more people`} />;
            return plan === UserPassPlan.FREE
                ? c('Warning').jt`You have reached the limit of users in this vault. ${upgradeLink}`
                : c('Warning').t`You have reached the limit of members who can access this vault.`;
        }
    })();

    return (
        <SidebarModal onClose={close} open>
            <Panel
                loading={loading}
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="modal-close-button"
                                className="flex-item-noshrink"
                                icon
                                pill
                                shape="solid"
                                onClick={close}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,

                            <Button
                                key="modal-invite-button"
                                color="norm"
                                pill
                                onClick={() => (memberLimitReached ? setLimitModalOpen(true) : createInvite({ vault }))}
                                disabled={!canManage || (plan === UserPassPlan.FREE && memberLimitReached)}
                            >
                                {c('Action').t`Invite others`}
                            </Button>,
                        ]}
                    />
                }
            >
                <SharedVaultItem
                    className="mt-3 mb-6"
                    color={vault.content.display.color}
                    icon={vault.content.display.icon}
                    name={vault.content.name}
                    shareId={vault.shareId}
                />

                {vault.shared ? (
                    <div className="flex flex-column gap-y-3">
                        {invites.length > 0 && <span className="color-weak">{c('Label').t`Invitations`}</span>}

                        {invites.map((item) => {
                            switch (item.type) {
                                case 'new':
                                    return (
                                        <PendingNewMember
                                            shareId={vault.shareId}
                                            key={item.key}
                                            email={item.invite.invitedEmail}
                                            newUserInviteId={item.invite.newUserInviteId}
                                            canManage={canManage}
                                            state={item.invite.state}
                                        />
                                    );
                                case 'existing':
                                    return (
                                        <PendingExistingMember
                                            key={item.key}
                                            shareId={vault.shareId}
                                            email={item.invite.invitedEmail}
                                            inviteId={item.invite.inviteId}
                                            canManage={canManage}
                                        />
                                    );
                            }
                        })}

                        {members.length > 0 && <span className="color-weak">{c('Label').t`Members`}</span>}

                        {members.map((member) => (
                            <ShareMember
                                key={member.email}
                                email={member.email}
                                shareId={vault.shareId}
                                userShareId={member.shareId}
                                me={vault.shareId === member.shareId}
                                owner={member.owner}
                                role={member.shareRoleId}
                                canManage={canManage}
                                canTransfer={vault.owner && hasMultipleOwnedWritableVaults}
                            />
                        ))}
                        {warning && <Card>{warning}</Card>}
                    </div>
                ) : (
                    <div className="absolute-center flex flex-column gap-y-3 text-center color-weak text-sm">
                        {c('Info')
                            .t`This vault is not currently shared with anyone. Invite people to share it with others.`}
                    </div>
                )}

                <Prompt
                    buttons={
                        <Button
                            pill
                            onClick={() => setLimitModalOpen(false)}
                            className="w-full"
                            shape="solid"
                            color="weak"
                        >
                            {c('Action').t`OK`}
                        </Button>
                    }
                    className="text-center"
                    onClose={() => setLimitModalOpen(false)}
                    open={limitModalOpen}
                    title={c('Title').t`Member limit`}
                >
                    <p>
                        {
                            // translator: full message is "Vaults can’t contain more than 10 users.""
                            c('Success').ngettext(
                                msgid`Vaults can’t contain more than ${vault.targetMaxMembers} user.`,
                                `Vaults can’t contain more than ${vault.targetMaxMembers} users.`,
                                vault.targetMaxMembers
                            )
                        }
                    </p>
                </Prompt>
            </Panel>
        </SidebarModal>
    );
};
