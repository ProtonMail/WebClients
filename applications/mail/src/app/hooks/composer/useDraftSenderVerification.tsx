import { useState } from 'react';

import { c } from 'ttag';

import { AlertModal, Button, useAddresses, useModalState } from '@proton/components';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { Address } from '@proton/shared/lib/interfaces';

import { MessageChange } from '../../components/composer/Composer';
import { getAddressFromEmail, getFromAddress } from '../../helpers/addresses';
import { MessageState } from '../../logic/messages/messagesTypes';

interface Props {
    onChange: MessageChange;
}

export const useDraftSenderVerification = ({ onChange }: Props) => {
    const [addresses] = useAddresses();
    const [defaultEmail, setDefaultEmail] = useState<string>('');

    const [senderChangedModalProps, setSenderChangedModalOpen, render] = useModalState();

    const modal = render && (
        <AlertModal
            title={c('Title').t`Sender changed`}
            buttons={[<Button color="norm" onClick={senderChangedModalProps.onClose}>{c('Action').t`OK`}</Button>]}
            {...senderChangedModalProps}
        >
            {c('Info')
                .t`The original sender of this message is no longer valid. Your message will be sent from your default address ${defaultEmail}.`}
        </AlertModal>
    );

    const verifyDraftSender = async (message: MessageState) => {
        const currentSender = message.data?.Sender;

        const actualAddress: Address | undefined = getAddressFromEmail(addresses, currentSender?.Address);

        if (!actualAddress || !getIsAddressActive(actualAddress)) {
            const defaultAddress = getFromAddress(addresses, '', undefined);

            setDefaultEmail(defaultAddress?.Email);

            if (defaultAddress) {
                onChange({
                    data: {
                        Sender: { Name: defaultAddress.DisplayName, Address: defaultAddress.Email },
                        AddressID: defaultAddress.ID,
                    },
                });
                setSenderChangedModalOpen(true);
            }
        }
    };

    return { verifyDraftSender, modal };
};
