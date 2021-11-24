import { useState, ChangeEvent, MutableRefObject } from 'react';
import { c } from 'ttag';
import { Label, Input, generateUID, classnames } from '@proton/components';
import ComposerAddresses from './addresses/Addresses';
import { MessageChange } from './Composer';
import { MessageSendInfo } from '../../hooks/useSendInfo';
import SelectSender from './addresses/SelectSender';
import ExtraExpirationTime from '../message/extras/ExtraExpirationTime';
import { MessageState } from '../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
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

    //
    return (
        <div className="composer-meta flex-item-noshrink ml0-5 mr1-5 pl1-25 pr0-25">
            <div className="flex flex-row flex-nowrap on-mobile-flex-column flex-align-items-center w100">
                <Label
                    htmlFor={`from-${uid}`}
                    className={classnames(['composer-meta-label pt0 text-semibold', disabled && 'placeholder'])}
                >
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
            <div className="flex flex-row flex-nowrap on-mobile-flex-column flex-align-items-center mt0 mb0-5">
                <Label
                    htmlFor={`subject-${uid}`}
                    className={classnames(['composer-meta-label pt0 text-semibold', disabled && 'placeholder'])}
                >
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
                    className="field-lighter composer-meta-input-subject"
                />
            </div>
            <ExtraExpirationTime marginBottom={false} message={message} />
        </div>
    );
};

export default ComposerMeta;
