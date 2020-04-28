import React from 'react';
import { LearnMore, Button, Icon } from 'react-components';
import { c } from 'ttag';
``;
import { MessageExtended } from '../../../models/message';

import { VERIFICATION_STATUS } from 'pmcrypto';

interface Props {
    message: MessageExtended;
}

const ExtraAttachedKey = ({ message }: Props) => {
    const promptKeyPinning = false && message.verificationStatus === VERIFICATION_STATUS.SIGNED_AND_VALID;
    // const promptKeyPinning = message.attached?.length
    //     && message.verificationStatus === VERIFICATION_STATUS.SIGNED_AND_VALID;
    if (!promptKeyPinning) {
        return null;
    }

    const handleTrustKey = () => {
        return;
    };

    return (
        <div className="bg-white-dm rounded bordered-container p0-5 mb0-5 flex flex-nowrap flex-items-center flex-spacebetween">
            <div className="flex">
                <Icon name="key" className="mtauto mbauto mr0-5" />
                <div className="mr0-5">{c('Info').t`An unknown public key has been detected for this recipient.`}</div>
                <div>
                    <LearnMore url="https://protonmail.com/support/knowledge-base/address-verification/" />
                </div>
            </div>
            <span className="flex-items-center">
                <Button onClick={handleTrustKey} className="flex flex-no-wrap">
                    {c('Action').t`Trust key`}
                </Button>
            </span>
        </div>
    );
};

export default ExtraAttachedKey;
