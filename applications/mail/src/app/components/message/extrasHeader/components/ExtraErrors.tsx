import { useState } from 'react';

import { c } from 'ttag';

import { Banner, Button, ButtonLike } from '@proton/atoms';
import { ButtonGroup, Icon, SettingsLink } from '@proton/components';
import type { MessageErrors, MessageState } from '@proton/mail/store/messages/messagesTypes';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';

import { useReloadMessage } from '../../../../hooks/message/useLoadMessage';

const getTranslations = (key: keyof MessageErrors, alreadyTried: boolean) => {
    switch (key) {
        case 'network':
            return c('Error').t`Network error: Please check your connection and try again.`;
        case 'decryption':
            return alreadyTried
                ? c('Error')
                      .t`Sorry, ${BRAND_NAME} can't decrypt your message. Please check that all your keys are active.`
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
                    <Banner
                        key={errorType}
                        variant="norm-outline"
                        icon={<Icon name="exclamation-triangle-filled" className="color-danger" />}
                        action={
                            showReload || showKeysLink ? (
                                <ButtonGroup>
                                    {showReload && (
                                        <Button onClick={handleReload} data-testid="errors-banner:reload">{c('Action')
                                            .t`Try again`}</Button>
                                    )}
                                    {showKeysLink && (
                                        <ButtonLike as={SettingsLink} path="/encryption-keys" app={APPS.PROTONMAIL}>
                                            {c('Action').t`View keys`}
                                        </ButtonLike>
                                    )}
                                </ButtonGroup>
                            ) : undefined
                        }
                        data-testid="errors-banner"
                    >
                        {getTranslations(errorType, alreadyTried)}
                    </Banner>
                );
            })}
        </>
    );
};

export default ExtraErrors;
