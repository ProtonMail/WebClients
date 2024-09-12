import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { type WasmInviteNotificationType } from '@proton/andromeda';
import type { ModalOwnProps } from '@proton/components';
import { Prompt } from '@proton/components';
import walletUser from '@proton/styles/assets/img/wallet/wallet-user.jpg';

import { Button } from '../../../atoms';
import { EmailSelect } from '../../EmailSelect';

interface Props extends ModalOwnProps {
    email: string;
    type: WasmInviteNotificationType;
    textContent: string;
    onSendInvite: (email: string, inviterAddressId: string) => void;
    loading?: boolean;
    defaultInviterAddressID?: string;
    checkHasSentInvite: (email: string) => boolean;
}

export const WalletNotFoundErrorModal = ({
    email,
    type,
    onSendInvite,
    textContent,
    loading,
    defaultInviterAddressID,
    checkHasSentInvite,
    ...modalProps
}: Props) => {
    const [selectedInviterId, setSelectedInviterId] = useState<string>();

    useEffect(() => {
        if (!selectedInviterId && defaultInviterAddressID) {
            setSelectedInviterId(defaultInviterAddressID);
        }
    }, [selectedInviterId, defaultInviterAddressID]);

    return (
        <Prompt
            {...modalProps}
            className=""
            buttons={[
                <Button
                    color="weak"
                    shape="solid"
                    size="large"
                    fullWidth
                    disabled={!selectedInviterId}
                    onClick={() => {
                        if (selectedInviterId) {
                            onSendInvite(email, selectedInviterId);
                        }
                    }}
                    loading={loading}
                >{c('Bitcoin send').t`Send invite email`}</Button>,
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
            <div className="flex flex-column items-center text-center">
                <img
                    src={walletUser}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                />
                <h1 className="my-3 text-semibold text-3xl">{c('Bitcoin send').t`Send invite to ${email}`}</h1>

                <p className="my-4 color-weak text-center">{textContent}</p>

                <div className="flex flex-row mt-2 w-full">
                    <EmailSelect
                        value={selectedInviterId}
                        onChange={(addressID) => {
                            setSelectedInviterId(addressID);
                        }}
                    />
                </div>
            </div>
        </Prompt>
    );
};
