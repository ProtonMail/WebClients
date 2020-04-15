import React from 'react';
import { Alert, classnames, FormModal } from 'react-components';
import { c, msgid } from 'ttag';

interface Props {
    mapErrors: { [key: string]: Error };
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
    if (cannotSend) {
        return (
            <FormModal
                title={c('Title').t`Errors detected`}
                hasSubmit={false}
                close={c('Action').t`Go back`}
                onClose={onClose}
                {...rest}
            >
                <Alert type="error">
                    {c('Send email with errors').ngettext(
                        msgid`We have detected errors. Your email cannot be sent to the email address entered due to the following reason:`,
                        `We have detected errors. Your email cannot be sent to any of the email addresses entered due to the following reasons:`,
                        emails.length
                    )}
                </Alert>
                <ul>
                    {emails.map((email, index) => (
                        <li key={index} className={classnames([index !== emails.length && 'mb0-5'])}>
                            <span className="bl mw100">{`${mapErrors[email].message} <${email}>`}</span>
                        </li>
                    ))}
                </ul>
                <Alert>
                    {c('Send email with errors').ngettext(
                        msgid`Please go back to edit the email address you entered.`,
                        `Please go back to edit the email addresses you entered.`,
                        emails.length
                    )}
                </Alert>
            </FormModal>
        );
    }
    return (
        <FormModal
            title={c('Title').t`Errors detected`}
            submit={c('Action').t`Send`}
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <Alert type="error">
                {c('Send email with errors')
                    .t`We have detected some errors. Your email cannot be sent to one or more of the email addresses entered due to the following reasons:`}
            </Alert>
            <ul>
                {emails.map((email, index) => (
                    <li key={index} className={classnames([index !== emails.length && 'mb0-5'])}>
                        <span className="bl mw100">{`${mapErrors[email].message} <${email}>`}</span>
                    </li>
                ))}
            </ul>
            <Alert>{c('Send email with errors').t`Do you want to send the email anyway?`}</Alert>
        </FormModal>
    );
};

export default SendWithErrorsModal;
