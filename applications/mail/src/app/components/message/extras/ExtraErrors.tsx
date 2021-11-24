import { useState } from 'react';
import { Button, Icon, SettingsLink } from '@proton/components';
import { c } from 'ttag';
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
                        className="bg-danger rounded p0-5 mb0-5 flex flex-nowrap flex-align-items-center"
                        data-testid="errors-banner"
                    >
                        <Icon name="triangle-exclamation" className="flex-item-noshrink mtauto mbauto" />
                        <span className="pl0-5 pr0-5 flex-item-fluid">{getTranslations(errorType, alreadyTried)}</span>
                        {showReload && (
                            <span className="flex-item-noshrink flex">
                                <Button size="small" onClick={handleReload}>
                                    {c('Action').t`Try again`}
                                </Button>
                            </span>
                        )}
                        {showKeysLink && (
                            <span className="flex-item-noshrink flex">
                                <SettingsLink
                                    path="/encryption-keys"
                                    app={APPS.PROTONMAIL}
                                    className="text-underline color-inherit mtauto"
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
