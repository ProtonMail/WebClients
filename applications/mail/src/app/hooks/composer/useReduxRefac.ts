import { useEffect } from 'react';

import { defaultFontStyle } from '@proton/components/components/editor/helpers';
import { useAddresses, useMailSettings, useUserSettings } from '@proton/components/hooks';

import { MessageChange } from '../../components/composer/Composer';
import { getAddressFromEmail } from '../../helpers/addresses';
import { changeSignature } from '../../helpers/message/messageSignature';
import { selectComposer } from '../../logic/composers/composerSelectors';
import { ComposerID } from '../../logic/composers/composerTypes';
import { MessageState } from '../../logic/messages/messagesTypes';
import { useAppSelector } from '../../logic/store';
import { RecipientType } from '../../models/address';

interface Props {
    composerID?: ComposerID;
    modelMessage: MessageState;
    handleChange: MessageChange;
    handleChangeContent: (content: string, refreshEditor?: boolean, silent?: boolean) => void;
}

const useReduxRefac = ({ composerID, modelMessage, handleChange, handleChangeContent }: Props) => {
    const [mailSettings] = useMailSettings();
    const [userSettings] = useUserSettings();
    const [addresses = []] = useAddresses();
    const composer = useAppSelector((state) => selectComposer(state, composerID || ''));

    useEffect(() => {
        if (!composer || composer.changesCount === 0) {
            return;
        }

        if (composer.senderEmailAddress !== modelMessage.data?.Sender.Address) {
            const prevAddress = getAddressFromEmail(addresses, modelMessage.data?.Sender.Address);
            const newAddress = getAddressFromEmail(addresses, composer.senderEmailAddress);
            const Sender = newAddress
                ? { Name: newAddress.DisplayName, Address: composer.senderEmailAddress }
                : undefined;

            if (!newAddress) {
                return;
            }

            handleChange({ data: { AddressID: newAddress.ID, Sender } });

            const fontStyle = defaultFontStyle(mailSettings);
            handleChangeContent(
                changeSignature(
                    modelMessage,
                    mailSettings,
                    userSettings,
                    fontStyle,
                    prevAddress?.Signature || '',
                    newAddress?.Signature || ''
                ),
                true
            );
        }

        const recipientTypes = ['ToList', 'CCList', 'BCCList'] as RecipientType[];
        for (const type of recipientTypes) {
            if (composer.recipients[type] !== modelMessage.data?.[type]) {
                handleChange({ data: { [type]: composer.recipients[type] } });
            }
        }
    }, [composer?.changesCount]);
};

export default useReduxRefac;
