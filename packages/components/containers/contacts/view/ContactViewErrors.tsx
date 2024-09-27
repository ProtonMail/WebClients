import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { CRYPTO_PROCESSING_TYPES } from '@proton/shared/lib/contacts/constants';
import type { CryptoProcessingError } from '@proton/shared/lib/contacts/decrypt';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

const { SIGNATURE_NOT_VERIFIED, FAIL_TO_READ, FAIL_TO_LOAD, FAIL_TO_DECRYPT } = CRYPTO_PROCESSING_TYPES;

const importanceOrder = [FAIL_TO_LOAD, FAIL_TO_READ, FAIL_TO_DECRYPT, SIGNATURE_NOT_VERIFIED];

const matchType = (errors: CryptoProcessingError[], type: CRYPTO_PROCESSING_TYPES) =>
    errors.find((error) => error.type === type);

const splitErrors = (errors: (CryptoProcessingError | Error)[]) => {
    return errors.reduce<{ cryptoErrors: CryptoProcessingError[]; otherErrors: Error[] }>(
        (acc, error) => {
            if (error instanceof Error) {
                acc.otherErrors.push(error);
            } else {
                acc.cryptoErrors.push(error);
            }
            return acc;
        },
        { cryptoErrors: [], otherErrors: [] }
    );
};

const selectError = (errors: (CryptoProcessingError | Error)[]) => {
    const { cryptoErrors, otherErrors } = splitErrors(errors);
    if (otherErrors.length) {
        return otherErrors[0];
    }
    return importanceOrder.map((type) => matchType(cryptoErrors, type)).filter(Boolean)[0];
};

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
    errors?: (CryptoProcessingError | Error)[];
    onReload: () => void;
    onSignatureError: (contactID: string) => void;
    onDecryptionError: (contactID: string) => void;
    isPreview?: boolean;
}

const ContactViewErrors = ({
    contactID,
    errors,
    onReload,
    onSignatureError,
    onDecryptionError,
    isPreview = false,
}: Props) => {
    if (!errors?.length) {
        return null;
    }

    const error = selectError(errors);

    // Should not happen but satisfy type checking
    if (!error) {
        return null;
    }

    if (error instanceof Error) {
        return (
            <div className="bg-danger rounded p-2 mt-4 flex flex-nowrap items-center">
                <Icon name="exclamation-circle" className="shrink-0 my-auto" />
                <span className="flex-1 py-2">
                    {c('Warning').t`The contact data is corrupted and cannot be displayed.`}
                </span>
            </div>
        );
    }

    const isWarning = error.type === SIGNATURE_NOT_VERIFIED;

    const bgColor = isWarning ? 'bg-warning' : 'bg-danger';
    const text = getText(error.type);

    const buttonText = getButtonText(error.type);

    const handleDecryptionErrorAction = () => {
        onDecryptionError(contactID);
    };

    const handleSignatureErrorAction = () => {
        onSignatureError(contactID);
    };

    const handleAction = () => {
        if (error.type === FAIL_TO_DECRYPT) {
            return handleDecryptionErrorAction();
        }
        if (error.type === SIGNATURE_NOT_VERIFIED) {
            return handleSignatureErrorAction();
        }
        onReload();
    };

    return (
        <div className={clsx([bgColor, 'rounded p-2 mt-4 flex flex-nowrap items-center'])}>
            <Icon name="exclamation-circle" className="shrink-0 my-auto" />
            <span className="flex-1 py-2">
                <span className="mr-2">{text}</span>
                <Href
                    className="underline inline-block color-inherit"
                    href={getKnowledgeBaseUrl('/proton-contacts')}
                >{c('Link').t`Learn more`}</Href>
            </span>
            {!isPreview && (
                <span className="shrink-0 flex">
                    <Button size="small" shape="outline" onClick={handleAction}>
                        {buttonText}
                    </Button>
                </span>
            )}
        </div>
    );
};

export default ContactViewErrors;
