import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useMaybeGroup } from '@proton/pass/components/Groups/GroupsProvider';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { InviteStepResponse } from '@proton/pass/components/Invite/Steps/InviteStepResponse';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { formatItemsCount } from '@proton/pass/lib/items/item.utils';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import type { Invite } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';

const getTexts = (invite: Invite, name: string, isGroup: boolean) => {
    const { inviterEmail, fromNewUser } = invite;

    if (fromNewUser) {
        return {
            title: c('Info').t`Congratulations, your access has been confirmed`,
            acceptText: c('Action').t`Continue`,
        };
    }
    if (isGroup) {
        return {
            title: inviterEmail,
            // translator: full sentence is split into 3 components in our design. Example: {eric.norbert@proton.me} invites the group {} to access items in {name of the vault}"
            subline: c('Info').t`invites the group ${name} to access items in`,
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

    /** Select once at mount: accepting removes the invite from Redux before
     * `onSuccess` fires — `useState` pins the value, `() => true` suppresses
     * store-triggered re-renders so the response flow can complete. */
    const [invite] = useState(useSelector(selectInviteByToken(token), () => true));
    const vaultInvite = invite?.targetType === ShareType.Vault ? invite : undefined;
    const { name, isGroup } = useMaybeGroup(invite?.invitedEmail);
    const { vaultLimitReached } = useSelector(selectVaultLimits);

    useEffect(() => {
        if (!vaultInvite) onInviteResponse({ ok: false });
    }, []);

    if (!vaultInvite) return null;

    const { vault } = vaultInvite;
    const { itemCount, memberCount } = vault;
    const { acceptText, ...modalTexts } = getTexts(vaultInvite, name, isGroup);

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

                <InviteStepResponse invite={vaultInvite} acceptText={acceptText} disabled={vaultLimitReached} />
            </ModalTwoFooter>
        </PassModal>
    );
};
