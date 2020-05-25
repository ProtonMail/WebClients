import React from 'react';
import { Alert, classnames, FormModal } from 'react-components';
import { c, msgid } from 'ttag';

interface Props {
    mapWarnings: { [key: string]: string[] };
    onSubmit: () => void;
    onClose: () => void;
}

const SendWithWarningsModal = ({ mapWarnings, onSubmit, onClose, ...rest }: Props) => {
    const emails = Object.keys(mapWarnings);
    const handleSubmit = () => {
        onSubmit();
        onClose();
    };
    return (
        <FormModal
            title={c('Title').t`Confirm recipient address?`}
            submit={c('Action').t`Send anyway`}
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <Alert type="warning">
                {c('Send email with warnings').ngettext(
                    msgid`We have detected some warnings. The following email address may not receive emails:`,
                    `We have detected some warnings. The following email addresses may not receive emails:`,
                    emails.length
                )}
            </Alert>
            <ul>
                {emails.map((email, index) => (
                    <li key={index} className={classnames([index !== emails.length && 'mb0-5'])}>
                        <span className="bl mw100">{`${mapWarnings[email].join(', ')} <${email}>`}</span>
                    </li>
                ))}
            </ul>
            <Alert>{c('Send email with warnings').t`Do you want to send the email anyway?`}</Alert>
        </FormModal>
    );
};

export default SendWithWarningsModal;
