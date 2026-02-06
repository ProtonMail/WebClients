import { type FC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { InviteStepResponse } from '@proton/pass/components/Invite/Steps/InviteStepResponse';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { getInvitedGroup } from '@proton/pass/lib/invites/invite.utils';
import { formatItemsCount } from '@proton/pass/lib/items/item.utils';
import { selectOrganizationGroups, selectVaultLimits } from '@proton/pass/store/selectors';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import type { Invite, MaybeNull } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import type { Group } from '@proton/shared/lib/interfaces';

const getTexts = (invite: Invite, invitedGroup: MaybeNull<Group>) => {
    const { inviterEmail, fromNewUser } = invite;

    if (fromNewUser) {
        return {
            title: c('Info').t`Congratulations, your access has been confirmed`,
            acceptText: c('Action').t`Continue`,
        };
    }
    if (invitedGroup) {
        return {
            title: inviterEmail,
            // translator: full sentence is split into 3 components in our design. Example: {eric.norbert@proton.me} invites the group {} to access items in {name of the vault}"
            subline: c('Info').t`invites the group ${invitedGroup.Name} to access items in`,
            acceptText: c('Action').t`Accept invitation`,
        };
    }
    return {
        title: inviterEmail,
        // translator: full sentence is split into 3 components in our design. Example: {eric.norbert@proton.me} invites you to access items in {name of the vault}"
        subline: c('Info').t`invites you to access items in`,
        acceptText: c('Action').t`Join shared vault`,
    };
};

type Props = { token: string };

export const VaultInviteRespond: FC<Props> = ({ token }) => {
    const { onInviteResponse } = useInviteActions();
    const invite = useSelector(selectInviteByToken(token));
    const groups = useSelector(selectOrganizationGroups);
    const invitedGroup = useMemo(() => getInvitedGroup(invite, groups), [groups, invite]);
    const { vaultLimitReached } = useSelector(selectVaultLimits);
    const invalid = !invite || invite.targetType !== ShareType.Vault;

    useEffect(() => {
        if (invalid) onInviteResponse({ ok: false });
    }, [invalid]);

    if (invalid) return null;

    const { vault } = invite;
    const { itemCount, memberCount } = vault;
    const { acceptText, ...modalTexts } = getTexts(invite, invitedGroup);

    return (
        <PassModal size="small" open onClose={() => onInviteResponse({ ok: false })} enableCloseWhenClickOutside>
            <ModalTwoHeader className="text-center text-break-all" hasClose={false} {...modalTexts} />
            <ModalTwoContent className="flex flex-column items-center">
                <VaultIcon
                    color={vault.content.display.color}
                    icon={vault.content.display.icon}
                    size={8}
                    background
                    className="mb-2"
                />
                <div className="text-xl text-bold text-ellipsis max-w-full">{vault.content.name}</div>
                <div className="color-weak">
                    <span>{formatItemsCount(itemCount)}</span>
                    <span> • </span>
                    <span>
                        {c('Info').ngettext(msgid`${memberCount} member`, `${memberCount} members`, memberCount)}
                    </span>
                </div>
            </ModalTwoContent>

            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                {vaultLimitReached && (
                    <Card className="mb-2 text-sm" type="primary">
                        {c('Warning').t`You have reached the limit of vaults you can have in your plan.`}
                    </Card>
                )}

                <InviteStepResponse invite={invite} acceptText={acceptText} disabled={vaultLimitReached} />
            </ModalTwoFooter>
        </PassModal>
    );
};
