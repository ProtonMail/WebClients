import React from 'react';
import { Icon, Tooltip } from 'react-components';
import { c } from 'ttag';

import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
}

const ExtraDecryptedSubject = ({ message }: Props) => {
    if (message.data?.Subject !== '...' || !message.decryptedSubject) {
        return null;
    }

    return (
        <div className="bg-white-dm rounded bordered-container p0-5 mb0-5 flex flex-nowrap flex-align-items-center flex-justify-space-between">
            <div className="flex">
                <Tooltip className="flex" title={c('Info').t`Subject is end-to-end encrypted`}>
                    <Icon
                        name="lock"
                        className="mtauto mbauto mr0-5"
                        alt={c('Info').t`Subject is end-to-end encrypted`}
                    />
                </Tooltip>
                <div className="mr0-5">
                    {c('Info').t`Subject:`} {message.decryptedSubject}
                </div>
            </div>
        </div>
    );
};

export default ExtraDecryptedSubject;
