import { useState } from 'react';

import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { Button } from '@proton/atoms';
import { Prompt, useModalState } from '@proton/components';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';

import { useMailDispatch } from 'proton-mail/store/hooks';

import type { MessageChange } from '../../components/composer/Composer';
import { getAddressFromEmail, getFromAddress } from '../../helpers/addresses';
import { composerActions } from '../../store/composers/composersSlice';
import type { MessageState } from '../../store/messages/messagesTypes';

interface Props {
    onChange: MessageChange;
    composerID: string;
}

export const useDraftSenderVerification = ({ composerID }: Props) => {
    const getAddresses = useGetAddresses();
    const [defaultEmail, setDefaultEmail] = useState<string>('');
    const dispatch = useMailDispatch();

    const [senderChangedModalProps, setSenderChangedModalOpen, render] = useModalState();

    const modal = render && (
        <Prompt
            title={c('Title').t`Sender changed`}
            buttons={[<Button color="norm" onClick={senderChangedModalProps.onClose}>{c('Action').t`OK`}</Button>]}
            {...senderChangedModalProps}
        >
            {c('Info')
                .t`The original sender of this message is no longer valid. Your message will be sent from your default address ${defaultEmail}.`}
        </Prompt>
    );

    const verifyDraftSender = async (message: MessageState) => {
        const currentSender = message.data?.Sender;
        const addresses = await getAddresses();

        const actualAddress: Address | undefined = getAddressFromEmail(addresses, currentSender?.Address);

        if (!actualAddress || !getIsAddressActive(actualAddress)) {
            const defaultAddress = getFromAddress(addresses, '', undefined);

            setDefaultEmail(defaultAddress?.Email);

            if (defaultAddress) {
                dispatch(
                    composerActions.setSender({
                        ID: composerID,
                        emailAddress: defaultAddress.Email,
                    })
                );
                setSenderChangedModalOpen(true);
            }
        }
    };

    return { verifyDraftSender, modal };
};
