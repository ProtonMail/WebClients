import React from 'react';
import { c } from 'ttag';

import { CryptoProcessingError } from 'proton-shared/lib/contacts/decrypt';
import { CRYPTO_PROCESSING_TYPES } from 'proton-shared/lib/contacts/constants';
import Icon from '../../components/icon/Icon';
import Href from '../../components/link/Href';

const { SIGNATURE_NOT_VERIFIED, FAIL_TO_READ, FAIL_TO_DECRYPT } = CRYPTO_PROCESSING_TYPES;

interface Props {
    errors?: CryptoProcessingError[];
}

const ContactViewErrors = ({ errors }: Props) => {
    if (!errors) return null;

    const errorTypes = errors.map(({ type }) => type);

    if (errorTypes.includes(SIGNATURE_NOT_VERIFIED)) {
        return (
            <div className="bg-global-attention p1">
                <Icon name="attention" className="mr1" />
                <span className="mr1">{c('Warning')
                    .t`Warning: the verification of this contact's signature failed.`}</span>
                <Href url="https://protonmail.com/support/knowledge-base/encrypted-contacts/">{c('Link')
                    .t`Learn more`}</Href>
            </div>
        );
    }

    if (errorTypes.includes(FAIL_TO_READ)) {
        return (
            <div className="bg-global-warning p1">
                <Icon name="attention" className="mr1" />
                <span className="mr1">{c('Warning')
                    .t`Error: the encrypted content failed decryption and cannot be read.`}</span>
                <Href url="https://protonmail.com/support/knowledge-base/encrypted-contacts/">{c('Link')
                    .t`Learn more`}</Href>
            </div>
        );
    }

    if (errorTypes.includes(FAIL_TO_DECRYPT)) {
        return (
            <div className="bg-global-warning p1">
                <Icon name="attention" className="mr1" />
                <span className="mr1">{c('Warning')
                    .t`Error: the encrypted content failed decryption and cannot be read.`}</span>
                <Href url="https://protonmail.com/support/knowledge-base/encrypted-contacts/">{c('Link')
                    .t`Learn more`}</Href>
            </div>
        );
    }

    return null;
};

export default ContactViewErrors;
