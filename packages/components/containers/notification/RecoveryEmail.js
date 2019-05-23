import React from 'react';
import { c } from 'ttag';
import { PrimaryButton, Field, useModals, useUserSettings } from 'react-components';

import EmailModal from './EmailModal';

const RecoveryEmail = () => {
    const { createModal } = useModals();
    const [{ Email } = {}] = useUserSettings();
    const email = Email.Value;
    const open = () => createModal(<EmailModal email={email} />);

    return (
        <Field className="w100">
            <span className="mr0-5">{email}</span>
            <PrimaryButton onClick={open}>{c('Action').t`Edit`}</PrimaryButton>
        </Field>
    );
};

export default RecoveryEmail;
