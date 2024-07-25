import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components/components';
import { Prompt, Tooltip } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks/index';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import walletExclusiveInvites from '@proton/styles/assets/img/wallet/wallet-user.png';
import { useWalletApiClients } from '@proton/wallet';

import { Button, Input } from '../../atoms';

interface InviteModalOwnProps {
    onInviteSent: (email: string) => void;
    inviterAddressID: string;
}

type Props = ModalOwnProps & InviteModalOwnProps;

export const InviteModal = ({ inviterAddressID, onInviteSent, ...modalProps }: Props) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const walletApi = useWalletApiClients();
    const { createNotification } = useNotifications();
    const [loadingInvite, withLoadingInvite] = useLoading();

    const handleSend = async () => {
        if (!validateEmailAddress(email)) {
            setError(c('Wallet invite').t`Email address is not valid`);
            return;
        }

        try {
            await walletApi.invite.sendNewcomerInvite(email, inviterAddressID);

            onInviteSent(email);
            createNotification({ text: c('Bitcoin send').t`Invitation sent` });
        } catch (error: any) {
            createNotification({ text: error?.error ?? c('Bitcoin send').t`Could not send invitation` });
        }
    };

    useEffect(() => {
        if (error) {
            if (validateEmailAddress(email)) {
                setError(null);
            }
        }
    }, [email, error]);

    const isInvitationSendingDisabled = Boolean(error || !email);

    return (
        <Prompt
            {...modalProps}
            buttons={[
                <Tooltip
                    title={
                        email
                            ? undefined
                            : c('Wallet invite').t`You need to have an email set on your account to send invites`
                    }
                >
                    <Button
                        fullWidth
                        color="weak"
                        shape="solid"
                        size="large"
                        disabled={isInvitationSendingDisabled}
                        onClick={() => {
                            void withLoadingInvite(handleSend());
                        }}
                        loading={loadingInvite}
                    >{c('Wallet invite').t`Send invite email now`}</Button>
                </Tooltip>,
                <Button
                    fullWidth
                    color="weak"
                    shape="solid"
                    size="large"
                    onClick={() => {
                        modalProps.onClose?.();
                    }}
                >{c('Wallet invite').t`Close`}</Button>,
            ]}
        >
            <div className="flex flex-column">
                <div className="flex items-center flex-column">
                    <img
                        src={walletExclusiveInvites}
                        alt=""
                        className="w-custom h-custom"
                        style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                    />

                    <h1 className="block text-semibold text-4xl text-center">{c('Wallet invite')
                        .t`Exclusive Invites`}</h1>
                </div>

                <p className="my-4 text-center color-weak">{c('Wallet invite')
                    .t`${WALLET_APP_NAME} Early Access is limited to Visionary supporters and invited users.`}</p>

                <p className="my-4 text-center color-weak">{c('Wallet invite')
                    .t`Invite your friends and family so you can all send Bitcoin via Email. You will get more invites as we add more servers.`}</p>

                <div className="flex flex-row mt-2">
                    <Input
                        id="invitee-email-input"
                        label={c('Wallet invite').t`Email address`}
                        placeholder={c('Wallet invite').t`Your friend's email`}
                        value={email}
                        error={error}
                        onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                            setEmail(event.target.value);
                        }}
                    />
                </div>
            </div>
        </Prompt>
    );
};
