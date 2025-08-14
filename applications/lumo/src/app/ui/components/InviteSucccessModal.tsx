import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoBoxHiding from '@proton/styles/assets/img/lumo/lumo-box-hiding.svg';
import lumoWaitlistSuccess from '@proton/styles/assets/img/lumo/lumo-waitlist-success.svg';

import { LumoPrompt } from './LumoPrompt/LumoPrompt';

interface InviteSentConfirmModalOwnProps {
    email: string;
    remainingInvites: number;
}

type Props = ModalOwnProps & InviteSentConfirmModalOwnProps;

export const InviteSuccessModal = ({ email, remainingInvites, ...modalProps }: Props) => {
    const hasInvitesRemaining = remainingInvites > 0;
    const remainingInvitesText = <span className="text-bold color-primary">{remainingInvites}</span>;
    const emailText = <span className="text-bold">{email}</span>;
    return (
        <LumoPrompt
            {...modalProps}
            buttons={[
                <Button fullWidth size="large" shape="solid" color="norm" onClick={modalProps.onClose}>{c(
                    'collider_2025: Invite Button'
                ).t`Close`}</Button>,
            ]}
            image={{
                src: hasInvitesRemaining ? lumoWaitlistSuccess : lumoBoxHiding,
            }}
            title={
                hasInvitesRemaining
                    ? c('collider_2025: Invite Success').t`Invite sent!`
                    : c('collider_2025: Invite Success').t`No invites left  `
            }
            info={
                hasInvitesRemaining
                    ? c('collider_2025: Invite Success')
                          .jt`We've invited ${emailText}. They'll get instructions on how to join the waitlist.`
                    : c('collider_2025: Invite Success')
                          .t`Thanks for helping others discover ${LUMO_SHORT_APP_NAME}! If more invites become available, we’ll let you know.`
            }
            lumoContent={
                hasInvitesRemaining && (
                    <div className="flex flex-column w-full color-weak items-center">
                        <span>{c('collider_2025: Invite Info')
                            .jt`You have ${remainingInvitesText} invitations remaining.`}</span>
                    </div>
                )
            }
        />
    );
};
