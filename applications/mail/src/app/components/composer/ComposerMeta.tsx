import React, { useState, ChangeEvent, MutableRefObject } from 'react';
import { c } from 'ttag';
import { Label, Input, generateUID } from 'react-components';
import ComposerAddresses from './addresses/Addresses';
import { MessageExtended } from '../../models/message';
import { MessageChange } from './Composer';
import { MessageSendInfo } from '../../hooks/useSendInfo';
import SelectSender from './addresses/SelectSender';

interface Props {
    message: MessageExtended;
    messageSendInfo: MessageSendInfo;
    disabled: boolean;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshContent: boolean) => void;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
}

const ComposerMeta = ({
    message,
    messageSendInfo,
    disabled,
    onChange,
    onChangeContent,
    addressesBlurRef,
    addressesFocusRef,
}: Props) => {
    const [uid] = useState(generateUID('composer'));

    const handleSubjectChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        onChange({ data: { Subject: input.value } });
    };

    return (
        <div className="composer-meta w100 flex-item-noshrink">
            <div className="flex flex-row flex-nowrap flex-align-items-center m0-5 pl0-5 pr0-5">
                <Label htmlFor={`from-${uid}`} className="composer-meta-label pt0 text-bold">
                    {c('Info').t`From`}
                </Label>
                <SelectSender
                    message={message}
                    disabled={disabled}
                    onChange={onChange}
                    onChangeContent={onChangeContent}
                    addressesBlurRef={addressesBlurRef}
                />
            </div>
            <ComposerAddresses
                message={message}
                messageSendInfo={messageSendInfo}
                disabled={disabled}
                onChange={onChange}
                addressesBlurRef={addressesBlurRef}
                addressesFocusRef={addressesFocusRef}
            />
            <div className="flex flex-row flex-nowrap flex-align-items-center m0-5 pl0-5 pr0-5">
                <Label htmlFor={`subject-${uid}`} className="composer-meta-label pt0 text-bold">
                    {c('Info').t`Subject`}
                </Label>
                <Input
                    id={`subject-${uid}`}
                    value={message.data?.Subject || ''}
                    placeholder={c('Placeholder').t`Subject`}
                    disabled={disabled}
                    onChange={handleSubjectChange}
                    onFocus={addressesBlurRef.current}
                    data-testid="composer:subject"
                />
            </div>
        </div>
    );
};

export default ComposerMeta;
