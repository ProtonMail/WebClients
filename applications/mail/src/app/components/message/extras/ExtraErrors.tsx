import React from 'react';
import { Icon, InlineLinkButton } from 'react-components';
import { c } from 'ttag';

import { MessageExtended, MessageErrors } from '../../../models/message';
import { useMessage } from '../../../hooks/message/useMessage';
import { useReloadMessage } from '../../../hooks/message/useLoadMessage';

const getTranslations = (key: keyof MessageErrors) => {
    switch (key) {
        case 'network':
            return c('Error').t`Network error: Please check your connection and try again.`;
        case 'decryption':
            return c('Error').t`Decryption error: decryption of this message's encryption content failed.`;
        case 'common':
            return c('Error').t`Message processing error.`;
    }
};

interface Props {
    message: MessageExtended;
}

const ExtraErrors = ({ message }: Props) => {
    const { addAction } = useMessage(message.localID);
    const reloadMessage = useReloadMessage(message.localID);

    const errorTypes = Object.keys(message.errors || {}) as (keyof MessageErrors)[];

    if (errorTypes.length === 0) {
        return null;
    }

    const handleReload = () => addAction(reloadMessage);

    // Using a Fragment here, is only to satisfy TS :(
    return (
        <>
            {errorTypes.map((errorType) => {
                const showButton = errorType === 'network' || errorType === 'decryption';

                return (
                    <div key={errorType} className="bg-global-warning color-white rounded p0-5 mb0-5 flex flex-nowrap">
                        <Icon name="attention" className="flex-item-noshrink mtauto mbauto" />
                        <span className="pl0-5 pr0-5 flex-item-fluid">{getTranslations(errorType)}</span>
                        {showButton && (
                            <span className="flex-item-noshrink flex">
                                <InlineLinkButton onClick={handleReload} className="underline color-currentColor">
                                    {c('Action').t`Try again`}
                                </InlineLinkButton>
                            </span>
                        )}
                    </div>
                );
            })}
        </>
    );
};

export default ExtraErrors;
