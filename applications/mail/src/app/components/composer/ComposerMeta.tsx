import type { ChangeEvent, MutableRefObject } from 'react';
import { forwardRef, useState } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms';
import { Label } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import ComposerBYOEClaimAddressButton from 'proton-mail/components/composer/addresses/ComposerBYOEClaimAddressButton';

import type { MessageSendInfo } from '../../hooks/useSendInfo';
import type { ComposerID } from '../../store/composers/composerTypes';
import type { MessageChange } from './Composer';
import ComposerExpirationTime from './ComposerExpirationTime';
import ComposerShortDomainSpotlight from './ComposerShortDomainSpotlight';
import ComposerAddresses from './addresses/Addresses';
import SelectSender from './addresses/SelectSender';

interface Props {
    composerID: ComposerID;
    message: MessageState;
    messageSendInfo: MessageSendInfo;
    disabled: boolean;
    onChange: MessageChange;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
    onEditExpiration: () => void;
    isInert: boolean;
}

const ComposerMeta = forwardRef<HTMLDivElement, Props>(
    (
        {
            composerID,
            message,
            messageSendInfo,
            disabled,
            onChange,
            addressesBlurRef,
            addressesFocusRef,
            onEditExpiration,
            isInert,
        },
        ref
    ) => {
        const [uid] = useState(generateUID('composer'));

        const handleSubjectChange = (event: ChangeEvent) => {
            const input = event.target as HTMLInputElement;
            onChange({ data: { Subject: input.value } });
        };

        return (
            <div
                className="composer-meta shrink-0 ml-2 mr-5 pl-5 pr-1"
                ref={ref}
                // @ts-ignore
                inert={isInert ? '' : undefined}
            >
                <ComposerShortDomainSpotlight>
                    <div className="flex flex-row flex-nowrap flex-column md:flex-row items-center w-full relative composer-light-field-container">
                        <Label
                            htmlFor={`from-${uid}`}
                            className={clsx(['composer-meta-label pt-0 color-hint pl-2', disabled && 'placeholder'])}
                        >
                            {c('Info').t`From`}
                        </Label>
                        <div className="inline-flex self-start max-w-full">
                            <SelectSender
                                composerID={composerID}
                                message={message}
                                disabled={disabled}
                                addressesBlurRef={addressesBlurRef}
                            />
                        </div>
                        <ComposerBYOEClaimAddressButton />
                    </div>
                </ComposerShortDomainSpotlight>
                <ComposerAddresses
                    messageSendInfo={messageSendInfo}
                    disabled={disabled}
                    addressesBlurRef={addressesBlurRef}
                    addressesFocusRef={addressesFocusRef}
                    composerID={composerID}
                />
                <div
                    className="flex flex-row flex-nowrap flex-column md:flex-row items-stretch md:items-center mt-0 composer-light-field-container"
                    title={c('Placeholder').t`Subject`}
                >
                    <Label
                        htmlFor={`subject-${uid}`}
                        className={clsx(['composer-meta-label pt-0 sr-only text-semibold', disabled && 'placeholder'])}
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
                        className="composer-light-field composer-meta-input-subject"
                    />
                </div>
                <ComposerExpirationTime message={message} onEditExpiration={onEditExpiration} />
            </div>
        );
    }
);

ComposerMeta.displayName = 'ComposerMeta';

export default ComposerMeta;
