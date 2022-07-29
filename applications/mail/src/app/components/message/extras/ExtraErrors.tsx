import { useState } from 'react';

import { c } from 'ttag';

import { Button, Icon, SettingsLink } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { useReloadMessage } from '../../../hooks/message/useLoadMessage';
import { MessageErrors, MessageState } from '../../../logic/messages/messagesTypes';

const getTranslations = (key: keyof MessageErrors, alreadyTried: boolean) => {
    switch (key) {
        case 'network':
            return c('Error').t`Network error: Please check your connection and try again.`;
        case 'decryption':
            return alreadyTried
                ? c('Error').t`Sorry, Proton can't decrypt your message. Please check that all your keys are active.`
                : c('Error').t`Decryption error: decryption of this message's encrypted content failed.`;
        case 'processing':
            return c('Error').t`Message processing error.`;
        case 'signature':
            return c('Error').t`Signature verification error.`;
        default:
            return c('Error').t`Unknown error.`;
    }
};

interface Props {
    message: MessageState;
}

const ExtraErrors = ({ message }: Props) => {
    const reloadMessage = useReloadMessage(message.localID);

    const [alreadyTried, setAlreadyTried] = useState(false);

    const errorTypes = (Object.keys(message.errors || {}) as (keyof MessageErrors)[]).filter(
        (type) => message.errors?.[type]?.length
    );

    if (errorTypes.length === 0) {
        return null;
    }

    const handleReload = () => {
        void reloadMessage();
        setAlreadyTried(true);
    };

    // Using a Fragment here, is only to satisfy TS :(
    return (
        <>
            {errorTypes.map((errorType) => {
                const showReload = errorType === 'network' || (errorType === 'decryption' && !alreadyTried);
                const showKeysLink = errorType === 'decryption' && alreadyTried;

                return (
                    <div
                        key={errorType}
                        className="bg-norm border rounded pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 mb0-85 flex flex-nowrap on-mobile-flex-column"
                        data-testid="errors-banner"
                    >
                        <div className="flex-item-fluid flex flex-nowrap on-mobile-mb0-5">
                            <Icon
                                name="exclamation-circle-filled"
                                className="flex-item-noshrink mt0-4 ml0-2 color-danger"
                            />
                            <span className="pl0-5 mt0-25 pr0-5 flex-item-fluid">
                                {getTranslations(errorType, alreadyTried)}
                            </span>
                        </div>
                        {showReload && (
                            <span className="flex-item-noshrink flex-align-items-start flex on-mobile-w100">
                                <Button
                                    size="small"
                                    color="weak"
                                    shape="outline"
                                    fullWidth
                                    className="rounded-sm"
                                    onClick={handleReload}
                                >{c('Action').t`Try again`}</Button>
                            </span>
                        )}
                        {showKeysLink && (
                            <span className="flex-item-noshrink flex-align-items-start flex on-mobile-w100">
                                <SettingsLink
                                    path="/encryption-keys"
                                    app={APPS.PROTONMAIL}
                                    className="text-underline color-inherit on-mobile-w100"
                                >
                                    {c('Action').t`View keys`}
                                </SettingsLink>
                            </span>
                        )}
                    </div>
                );
            })}
        </>
    );
};

export default ExtraErrors;
