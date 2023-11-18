import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, Progress } from '@proton/components/components';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { inviteAcceptIntent, inviteRejectIntent } from '@proton/pass/store/actions';
import { selectUserVerified, selectVaultLimits } from '@proton/pass/store/selectors';
import type { Invite } from '@proton/pass/types/data/invites';

import { useInviteContext } from './InviteContextProvider';
import { UserVerificationMessage } from './UserVerificationMessage';

export const VaultInviteRespond: VFC<Invite> = (invite) => {
    const { inviterEmail, invitedAddressId, token, vault, fromNewUser } = invite;
    const { itemCount, memberCount } = vault;
    const { vaultLimitReached } = useSelector(selectVaultLimits);
    const { onInviteResponse } = useInviteContext();

    const acceptInvite = useActionRequest({ action: inviteAcceptIntent, onSuccess: onInviteResponse });
    const rejectInvite = useActionRequest({ action: inviteRejectIntent, onSuccess: onInviteResponse });

    const handleRejectInvite = () => rejectInvite.dispatch({ inviteToken: invite.token });
    const handleAcceptInvite = () => acceptInvite.dispatch({ inviteToken: token, inviterEmail, invitedAddressId });

    const loading = acceptInvite.loading || rejectInvite.loading;
    const userVerified = useSelector(selectUserVerified);

    return (
        <ModalTwo size="small" open onClose={onInviteResponse} enableCloseWhenClickOutside>
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
            <ModalTwoContent className="flex flex-column flex-align-items-center">
                <VaultIcon
                    color={vault.content.display.color}
                    icon={vault.content.display.icon}
                    size={32}
                    background
                    className="mb-2"
                />
                <div className="text-xl text-bold text-ellipsis max-w-full">{vault.content.name}</div>
                <div className="color-weak">
                    <span>{c('Info').ngettext(msgid`${itemCount} item`, `${itemCount} items`, itemCount)}</span>
                    <span> • </span>
                    <span>
                        {c('Info').ngettext(msgid`${memberCount} member`, `${memberCount} members`, memberCount)}
                    </span>
                </div>
            </ModalTwoContent>

            <ModalTwoFooter className="flex flex-column flex-align-items-stretch text-center">
                {!userVerified && <UserVerificationMessage />}
                {userVerified && vaultLimitReached && (
                    <Card className="mb-2">
                        {c('Warning').t`You have reached the limit of vaults you can have in your plan.`}
                    </Card>
                )}
                <Button
                    pill
                    size="large"
                    shape="solid"
                    color="norm"
                    disabled={loading || !userVerified || vaultLimitReached}
                    loading={acceptInvite.loading}
                    onClick={handleAcceptInvite}
                >
                    {fromNewUser ? c('Action').t`Continue` : c('Action').t`Join shared vault`}
                </Button>

                <Button
                    pill
                    size="large"
                    shape="solid"
                    color="weak"
                    disabled={loading || !userVerified}
                    loading={rejectInvite.loading}
                    onClick={handleRejectInvite}
                >
                    {fromNewUser ? c('Action').t`Reject` : c('Action').t`Reject invitation`}
                </Button>

                {acceptInvite.loading && (
                    <div className="ui-purple flex gap-x-2 flex-align-items-center">
                        <Progress
                            value={
                                invite.vault.itemCount > 0
                                    ? Math.round(100 * (acceptInvite.progress / invite.vault.itemCount))
                                    : 0
                            }
                            className="flex-item-fluid progress-bar--norm"
                        />

                        <small className="block">
                            {acceptInvite.progress} / {invite.vault.itemCount}
                        </small>
                        <CircleLoader size="small" />
                    </div>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};
