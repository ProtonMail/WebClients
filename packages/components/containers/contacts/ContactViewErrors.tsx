import React from 'react';
import { c } from 'ttag';
import { CryptoProcessingError } from 'proton-shared/lib/contacts/decrypt';
import { CRYPTO_PROCESSING_TYPES } from 'proton-shared/lib/contacts/constants';
import Icon from '../../components/icon/Icon';
import Href from '../../components/link/Href';
import { Button } from '../../components';
import { classnames } from '../../helpers';
import { useModals } from '../../hooks';
import ContactDecryptionErrorModal from './modals/ContactDecryptionErrorModal';
import ContactSignatureErrorModal from './modals/ContactSignatureErrorModal';

const { SIGNATURE_NOT_VERIFIED, FAIL_TO_READ, FAIL_TO_LOAD, FAIL_TO_DECRYPT } = CRYPTO_PROCESSING_TYPES;

const importanceOrder = [FAIL_TO_LOAD, FAIL_TO_READ, FAIL_TO_DECRYPT, SIGNATURE_NOT_VERIFIED];

const matchType = (errors: CryptoProcessingError[], type: CRYPTO_PROCESSING_TYPES) =>
    errors.find((error) => error.type === type);

const selectError = (errors: CryptoProcessingError[]) =>
    importanceOrder.map((type) => matchType(errors, type)).filter(Boolean)[0];

const getText = (errorType: CRYPTO_PROCESSING_TYPES) => {
    switch (errorType) {
        case FAIL_TO_DECRYPT:
            return c('Warning').t`The decryption of the encrypted content failed.`;
        case SIGNATURE_NOT_VERIFIED:
            return c('Warning').t`The verification of the contact details' signature failed.`;
        default:
            return c('Warning').t`The contact failed to load.`;
    }
};

const getButtonText = (errorType: CRYPTO_PROCESSING_TYPES) => {
    switch (errorType) {
        case FAIL_TO_DECRYPT:
            return c('Action').t`Recover data`;
        case SIGNATURE_NOT_VERIFIED:
            return c('Action').t`Re-sign`;
        default:
            return null;
    }
};

interface Props {
    contactID: string;
    errors?: CryptoProcessingError[];
    onReload: () => void;
}

const ContactViewErrors = ({ contactID, errors, onReload }: Props) => {
    const { createModal } = useModals();

    if (!errors?.length) {
        return null;
    }

    const error = selectError(errors);

    // Should not happen but satisfy type checking
    if (!error) {
        return null;
    }

    const isWarning = error.type === SIGNATURE_NOT_VERIFIED;

    const bgColor = isWarning ? 'bg-warning' : 'bg-danger';
    const text = getText(error.type);

    const buttonText = getButtonText(error.type);

    const handleDescriptionErrorAction = () => {
        createModal(<ContactDecryptionErrorModal contactID={contactID} />);
    };

    const handleSignatureErrorAction = () => {
        createModal(<ContactSignatureErrorModal contactID={contactID} />);
    };

    const handleAction = () => {
        if (error.type === FAIL_TO_DECRYPT) {
            return handleDescriptionErrorAction();
        }
        if (error.type === SIGNATURE_NOT_VERIFIED) {
            return handleSignatureErrorAction();
        }
        onReload();
    };

    return (
        <div className={classnames([bgColor, 'rounded p0-5 mt1 flex flex-nowrap flex-align-items-center'])}>
            <Icon name="attention" className="flex-item-noshrink mtauto mbauto" />
            <span className="flex-item-fluid pl0-5 pr0-5">
                <span className="mr0-5">{text}</span>
                <Href
                    className="underline inline-block color-inherit"
                    url="https://protonmail.com/support/knowledge-base/encrypted-contacts/"
                >{c('Link').t`Learn more`}</Href>
            </span>
            <span className="flex-item-noshrink flex">
                <Button size="small" onClick={handleAction}>
                    {buttonText}
                </Button>
            </span>
        </div>
    );
};

export default ContactViewErrors;
