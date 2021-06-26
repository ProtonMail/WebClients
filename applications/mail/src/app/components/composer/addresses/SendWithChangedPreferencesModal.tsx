import React from 'react';
import { Alert, classnames, FormModal } from 'react-components';
import { c } from 'ttag';

interface Props {
    emails: string[];
    onSubmit: () => void;
    onClose: () => void;
}

const SendWithChangedPreferencesModal = ({ emails, onSubmit, onClose, ...rest }: Props) => {
    const handleSubmit = () => {
        onSubmit();
        onClose();
    };
    return (
        <FormModal
            title={c('Title').t`Send with changed preferences?`}
            submit={c('Action').t`Send anyway`}
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <Alert type="warning">
                {c('Send email with changed preferences')
                    .t`The contacts for the following addresses have been deleted, so the corresponding encryption preferences have been updated accordingly:`}
            </Alert>
            <ul>
                {emails.map((email, index) => (
                    <li
                        key={index} // eslint-disable-line react/no-array-index-key
                        className={classnames([index !== emails.length && 'mb0-5'])}
                    >
                        <span className="block max-w100">{email}</span>
                    </li>
                ))}
            </ul>
        </FormModal>
    );
};

export default SendWithChangedPreferencesModal;
