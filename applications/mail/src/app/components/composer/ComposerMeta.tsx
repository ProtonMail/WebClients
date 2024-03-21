import { ChangeEvent, MutableRefObject, useState } from 'react';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { Label, generateUID } from '@proton/components';
import clsx from '@proton/utils/clsx';

import useGenieModel from '../../genie/useGenieModel';
import { MessageSendInfo } from '../../hooks/useSendInfo';
import { ComposerID } from '../../store/composers/composerTypes';
import { MessageState } from '../../store/messages/messagesTypes';
import { MessageChange } from './Composer';
import ComposerExpirationTime from './ComposerExpirationTime';
import ComposerAddresses from './addresses/Addresses';
import SelectSender from './addresses/SelectSender';

interface Props {
    composerID: ComposerID;
    message: MessageState;
    messageSendInfo: MessageSendInfo;
    disabled: boolean;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshContent: boolean) => void;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
    onEditExpiration: () => void;
}

const ComposerMeta = ({
    composerID,
    message,
    messageSendInfo,
    disabled,
    onChange,
    onChangeContent,
    addressesBlurRef,
    addressesFocusRef,
    onEditExpiration,
}: Props) => {
    const [uid] = useState(generateUID('composer'));
    const {
        genieModelStatus,
        genieModelDownloadProgress,
        genieWish,
        setGenieWish,
        handleGenieKeyDown,
        startLoadingGenieModel,
        stopLoadingGenieModel,
    } = useGenieModel({ message, onChange, onChangeContent });

    const handleSubjectChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        onChange({ data: { Subject: input.value } });
    };

    return (
        <div className="composer-meta shrink-0 ml-2 mr-5 pl-5 pr-1">
            <div className="flex flex-row flex-nowrap flex-column md:flex-row items-center w-full">
                <Label
                    htmlFor={`from-${uid}`}
                    className={clsx(['composer-meta-label pt-0 text-semibold', disabled && 'placeholder'])}
                >
                    {c('Info').t`From`}
                </Label>
                <SelectSender
                    composerID={composerID}
                    message={message}
                    disabled={disabled}
                    onChangeContent={onChangeContent}
                    addressesBlurRef={addressesBlurRef}
                />
            </div>
            <ComposerAddresses
                message={message}
                messageSendInfo={messageSendInfo}
                disabled={disabled}
                addressesBlurRef={addressesBlurRef}
                addressesFocusRef={addressesFocusRef}
                composerID={composerID}
            />
            <div className="flex flex-row flex-nowrap flex-column md:flex-row items-stretch md:items-center mt-0">
                <Label
                    htmlFor={`subject-${uid}`}
                    className={clsx(['composer-meta-label pt-0 text-semibold', disabled && 'placeholder'])}
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
            <div className="flex flex-row flex-nowrap flex-column md:flex-row items-stretch md:items-center mt-0 mb-2">
                <Label htmlFor={`genie-${uid}`} className={clsx(['composer-meta-label pt-0 text-bold color-primary'])}>
                    {c('Info').t`AI`} ✨
                </Label>
                {genieModelStatus == 'unloaded' && (
                    <>
                        <Button
                            color="norm"
                            shape="ghost"
                            size="small"
                            tabIndex={-1}
                            icon
                            title="Load AI Model"
                            onClick={startLoadingGenieModel}
                            className={clsx('text-left text-no-decoration relative border border-md')}
                        >
                            Load AI model
                        </Button>
                    </>
                )}
                {(genieModelStatus == 'downloading' || genieModelStatus == 'loading') && (
                    <>
                        {genieModelStatus == 'downloading' && (
                            <>Downloading AI model... {Math.floor(genieModelDownloadProgress * 100)} %</>
                        )}
                        {genieModelStatus == 'loading' && <>Loading AI model on GPU...</>}
                        <Button
                            color="norm"
                            shape="ghost"
                            size="small"
                            tabIndex={-1}
                            icon
                            title="Load AI Model"
                            onClick={stopLoadingGenieModel}
                            className={clsx('text-left text-no-decoration relative border border-md')}
                        >
                            Cancel
                        </Button>
                    </>
                )}
                {genieModelStatus == 'loaded' && (
                    <>
                        <Input
                            id={`genie-${uid}`}
                            value={genieWish}
                            placeholder='Try "Invite Vanessa to my birthday party"'
                            onChange={(e) => setGenieWish(e.target?.value || '')}
                            onKeyDown={handleGenieKeyDown}
                            disabled={false}
                            data-testid="composer:genie"
                            className="composer-light-field"
                        />
                    </>
                )}
            </div>
            <ComposerExpirationTime message={message} onEditExpiration={onEditExpiration} />
        </div>
    );
};

export default ComposerMeta;
