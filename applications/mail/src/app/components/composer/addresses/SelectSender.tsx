import React, { useState, ChangeEvent, MutableRefObject } from 'react';
import { Select, generateUID, useAddresses, useMailSettings } from 'react-components';
import { MessageExtended } from '../../../models/message';
import { getAddressFromEmail, getFromAddresses } from '../../../helpers/addresses';
import { MessageChange } from '../Composer';
import { changeSignature } from '../../../helpers/message/messageSignature';

interface Props {
    message: MessageExtended;
    disabled: boolean;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshContent: boolean) => void;
    addressesBlurRef: MutableRefObject<() => void>;
}

const SelectSender = ({ message, disabled, onChange, onChangeContent, addressesBlurRef }: Props) => {
    const [mailSettings = {}] = useMailSettings();
    const [addresses = []] = useAddresses();

    const [uid] = useState(generateUID('select-sender'));

    const addressesOptions = getFromAddresses(addresses, message.originalTo).map((address) => ({
        text: address.Email,
        value: address.Email, // Because of + addresses, the ID can not be unique while the email is
    }));

    const handleFromChange = (event: ChangeEvent) => {
        const select = event.target as HTMLSelectElement;
        const email = select.value;

        const currentAddress = getAddressFromEmail(addresses, message.data?.Sender.Address);
        const newAddress = getAddressFromEmail(addresses, email);
        const Sender = newAddress ? { Name: newAddress.DisplayName, Address: email } : undefined;

        onChange({ data: { AddressID: newAddress?.ID, Sender } });
        onChangeContent(
            changeSignature(message, mailSettings, currentAddress?.Signature || '', newAddress?.Signature || ''),
            true
        );
    };

    return (
        <Select
            id={`sender-${uid}`}
            options={addressesOptions}
            value={message.data?.Sender?.Address}
            disabled={disabled}
            onChange={handleFromChange}
            onFocus={addressesBlurRef.current}
            data-testid="composer:from"
        />
    );
};

export default SelectSender;
