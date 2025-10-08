import { type FC, useEffect } from 'react';
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
import { formatItemsCount } from '@proton/pass/lib/items/item.utils';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import { ShareType } from '@proton/pass/types';

type Props = { token: string };

export const VaultInviteRespond: FC<Props> = ({ token }) => {
    const { onInviteResponse } = useInviteActions();
    const invite = useSelector(selectInviteByToken(token));
    const { vaultLimitReached } = useSelector(selectVaultLimits);
    const invalid = !invite || invite.targetType !== ShareType.Vault;

    useEffect(() => {
        if (invalid) onInviteResponse({ ok: false });
    }, [invalid]);

    if (invalid) return null;

    const { inviterEmail, vault, fromNewUser } = invite;
    const { itemCount, memberCount } = vault;

    return (
        <PassModal size="small" open onClose={() => onInviteResponse({ ok: false })} enableCloseWhenClickOutside>
            <ModalTwoHeader
                className="text-center text-break-all"
                hasClose={false}
                {...(fromNewUser
                    ? { title: c('Info').t`Congratulations, your access has been confirmed` }
                    : {
                          title: inviterEmail,
                          // translator: full sentence is split into 3 components in our design. Example: {eric.norbert@proton.me} invites you to access items in {name of the vault}"
                          subline: c('Info').t`invites you to access items in`,
                      })}
            />
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

                <InviteStepResponse
                    invite={invite}
                    acceptText={fromNewUser ? c('Action').t`Continue` : c('Action').t`Join shared vault`}
                    disabled={vaultLimitReached}
                />
            </ModalTwoFooter>
        </PassModal>
    );
};
