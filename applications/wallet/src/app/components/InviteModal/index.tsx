import { ChangeEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Logo, ModalOwnProps } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { useWalletApiClients } from '@proton/wallet';

import { Button, Input, Modal } from '../../atoms';
import { APP_NAME } from '../../config';

interface InviteModalOwnProps {
    onInviteSent: (email: string) => void;
}

type Props = ModalOwnProps & InviteModalOwnProps;

export const InviteModal = ({ onInviteSent, ...modalProps }: Props) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const walletApi = useWalletApiClients();
    const { createNotification } = useNotifications();

    const handleSend = async () => {
        if (!validateEmailAddress(email)) {
            setError(c('Wallet invite').t`Email address is not valid`);
            return;
        }

        try {
            await walletApi.invite.sendNewcomerInvite(email);

            onInviteSent(email);
            createNotification({ text: c('Bitcoin send').t`Invitation sent` });
        } catch {
            createNotification({ text: c('Bitcoin send').t`Could not send invitation` });
        }
    };

    useEffect(() => {
        if (error) {
            if (validateEmailAddress(email)) {
                setError(null);
            }
        }
    }, [email, error]);

    return (
        <Modal {...modalProps}>
            <div className="flex flex-column">
                <div className="flex items-center flex-column">
                    <div className="mb-8 p-2 rounded-lg bg-weak flex items-center">
                        <Logo appName={APP_NAME} variant="glyph-only" size={15} />
                    </div>
                    <div className="flex flex-column items-center">
                        <span className="block text-4xl text-semibold text-center">{c('Wallet invite')
                            .t`Share the gift of Bitcoin!`}</span>
                    </div>
                </div>

                <p className="my-4 text-center color-weak">{c('Wallet invite')
                    .t`Share the ${WALLET_APP_NAME} Bitcoin experience with your friends and family! Enter their email to invite them to ${WALLET_APP_NAME} so you can all send Bitcoin via Email.`}</p>

                <div className="flex flex-row my-6">
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

                <div className="w-full px-8 mt-6">
                    <Button
                        fullWidth
                        color="norm"
                        shape="solid"
                        disabled={Boolean(error || !email)}
                        onClick={() => {
                            void handleSend();
                        }}
                    >{c('Wallet invite').t`Send invite email now`}</Button>
                </div>
            </div>
        </Modal>
    );
};
