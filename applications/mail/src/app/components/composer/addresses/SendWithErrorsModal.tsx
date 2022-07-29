import { c, msgid } from 'ttag';

import {
    Button,
    Form,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    classnames,
} from '@proton/components';
import {
    ENCRYPTION_PREFERENCES_ERROR_TYPES,
    EncryptionPreferencesError,
} from '@proton/shared/lib/mail/encryptionPreferences';

interface Props {
    mapErrors: { [key: string]: EncryptionPreferencesError };
    cannotSend?: boolean;
    onSubmit: () => void;
    onClose: () => void;
}

const SendWithErrorsModal = ({ mapErrors, cannotSend, onSubmit, onClose, ...rest }: Props) => {
    const emails = Object.keys(mapErrors);
    const handleSubmit = () => {
        onSubmit();
        onClose();
    };

    // We want to display the error message and not change it elsewhere because they are used at other places in the app,
    // but some of them might need a bit more context to give more information to the user in this modal
    const getErrorMessage = (error: EncryptionPreferencesError, email: string) => {
        if (error.type === ENCRYPTION_PREFERENCES_ERROR_TYPES.EXTERNAL_USER_NO_VALID_PINNED_KEY) {
            // translator: This message is displayed when the recipient has an invalid key. The first variable is the error message to display ("The sending key is not valid"), already translated and the second one is the email causing the error.
            return c('Error')
                .t`${error.message} for <${email}>. You can add another key or disable encryption for this contact to resolve the issue.`;
        }
        return `${error.message} <${email}>`;
    };

    if (cannotSend) {
        return (
            <ModalTwo size="large" onClose={onClose} {...rest}>
                <ModalTwoHeader title={c('Title').t`Sending error`} />
                <ModalTwoContent>
                    <span>
                        {c('Send email with errors').ngettext(
                            msgid`We have detected errors. Your email cannot be sent to the email address entered due to the following reason:`,
                            `We have detected errors. Your email cannot be sent to any of the email addresses entered due to the following reasons:`,
                            emails.length
                        )}
                    </span>
                    <ul>
                        {emails.map((email, index) => (
                            <li
                                key={index} // eslint-disable-line react/no-array-index-key
                                className={classnames([index !== emails.length && 'mb0-5'])}
                            >
                                <span className="block max-w100">{getErrorMessage(mapErrors[email], email)}</span>
                            </li>
                        ))}
                    </ul>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button color="norm" onClick={onClose}>{c('Action').t`Close`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }
    return (
        <ModalTwo
            size="large"
            title={c('Title').t`Sending error`}
            as={Form}
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <ModalTwoHeader />
            <ModalTwoContent>
                <span>
                    {c('Send email with errors')
                        .t`We have detected some errors. Your email cannot be sent to one or more of the email addresses entered due to the following reasons:`}
                </span>
                <ul>
                    {emails.map((email, index) => (
                        <li
                            key={index} // eslint-disable-line react/no-array-index-key
                            className={classnames([index !== emails.length && 'mb0-5'])}
                        >
                            <span className="block max-w100">{getErrorMessage(mapErrors[email], email)}</span>
                        </li>
                    ))}
                </ul>
                <span>{c('Send email with errors').t`Do you want to send the email anyway?`}</span>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button type="submit" color="norm">{c('Action').t`Send`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SendWithErrorsModal;
