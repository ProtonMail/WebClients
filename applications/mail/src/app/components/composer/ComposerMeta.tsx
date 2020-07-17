import React, { useState, ChangeEvent, MutableRefObject } from 'react';
import { c } from 'ttag';
import { Label, Select, Input, generateUID, useMailSettings } from 'react-components';
import { Address, MailSettings } from 'proton-shared/lib/interfaces';

import ComposerAddresses from './addresses/Addresses';
import { MessageExtended } from '../../models/message';
import { getFromAdresses } from '../../helpers/addresses';
import { MessageChange } from './Composer';
import { MessageSendInfo } from '../../hooks/useSendInfo';
import { changeSignature } from '../../helpers/message/messageSignature';

interface Props {
    message: MessageExtended;
    addresses: Address[];
    mailSettings: MailSettings;
    messageSendInfo: MessageSendInfo;
    disabled: boolean;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshContent: boolean) => void;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
}

const ComposerMeta = ({
    message,
    addresses,
    messageSendInfo,
    disabled,
    onChange,
    onChangeContent,
    addressesBlurRef,
    addressesFocusRef
}: Props) => {
    const [uid] = useState(generateUID('composer'));
    const [mailSettings] = useMailSettings();

    const addressesOptions = getFromAdresses(addresses, message.originalTo).map((address) => ({
        text: address.Email,
        value: address.ID
    }));

    const handleFromChange = (event: ChangeEvent) => {
        const select = event.target as HTMLSelectElement;
        const AddressID = select.value;
        const currentAddress = addresses.find((address: Address) => address.Email === message.data?.Sender.Address);
        const address = addresses.find((address: Address) => address.ID === AddressID);
        const Sender = address ? { Name: address.DisplayName, Address: address.Email } : undefined;
        onChange({ data: { AddressID, Sender } });
        onChangeContent(
            changeSignature(message, mailSettings, currentAddress?.Signature || '', address?.Signature || ''),
            true
        );
    };

    const handleSubjectChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        onChange({ data: { Subject: input.value } });
    };

    return (
        <div className="composer-meta w100 flex-item-noshrink">
            <div className="flex flex-row flex-nowrap flex-items-center m0-5 pl0-5 pr0-5">
                <Label htmlFor={`from-${uid}`} className="composer-meta-label pt0 bold">
                    {c('Info').t`From`}
                </Label>
                <Select
                    id={`from-${uid}`}
                    options={addressesOptions}
                    value={message.data?.AddressID}
                    disabled={disabled}
                    onChange={handleFromChange}
                    onFocus={addressesBlurRef.current}
                    data-cy="from"
                ></Select>
            </div>
            <ComposerAddresses
                message={message}
                messageSendInfo={messageSendInfo}
                disabled={disabled}
                onChange={onChange}
                addressesBlurRef={addressesBlurRef}
                addressesFocusRef={addressesFocusRef}
            />
            <div className="flex flex-row flex-nowrap flex-items-center m0-5 pl0-5 pr0-5">
                <Label htmlFor={`subject-${uid}`} className="composer-meta-label pt0 bold">
                    {c('Info').t`Subject`}
                </Label>
                <Input
                    id={`subject-${uid}`}
                    value={message.data?.Subject || ''}
                    placeholder={c('Placeholder').t`Subject`}
                    disabled={disabled}
                    onChange={handleSubjectChange}
                    onFocus={addressesBlurRef.current}
                    data-cy="subject"
                />
            </div>
        </div>
    );
};

export default ComposerMeta;
