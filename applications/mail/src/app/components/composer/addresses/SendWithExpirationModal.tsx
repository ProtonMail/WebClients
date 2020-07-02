import React from 'react';
import { Alert, classnames, FormModal, Href } from 'react-components';
import { c, msgid } from 'ttag';

interface Props {
    emails: string[];
    onSubmit: () => void;
    onClose: () => void;
}

const SendWithExpirationModal = ({ emails, onSubmit, onClose, ...rest }: Props) => {
    const handleSubmit = () => {
        onSubmit();
        onClose();
    };
    return (
        <FormModal
            title={c('Title').t`Send without expiration?`}
            submit={c('Action').t`Send anyway`}
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <Alert>
                {c('Info')
                    .t`Message expiration works out-of-the-box when sending emails to other ProtonMail users. To send expiring emails to non-ProtonMail users, please cancel and add password protection to your email.`}
                <br />
                <Href url="https://protonmail.com/support/knowledge-base/expiration/">{c('Info').t`Learn more`}</Href>
            </Alert>
            <Alert type="warning">
                {c('Send email with warnings').ngettext(
                    msgid`If you decide to send the message anyway, the following recipient will receive the email without expiration:`,
                    `If you decide to send the message anyway, the following recipients will receive the email without expiration:`,
                    emails.length
                )}
            </Alert>
            <ul>
                {emails.map((email, index) => (
                    <li key={index} className={classnames([index !== emails.length && 'mb0-5'])}>
                        <span className="bl mw100">{email}</span>
                    </li>
                ))}
            </ul>
        </FormModal>
    );
};

export default SendWithExpirationModal;
