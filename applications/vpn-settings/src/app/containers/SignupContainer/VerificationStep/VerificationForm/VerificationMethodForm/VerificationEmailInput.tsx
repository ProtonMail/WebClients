import React, { useState } from 'react';
import { PrimaryButton, InputFieldTwo, useFormErrors } from 'react-components';
import { c } from 'ttag';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';

interface Props {
    defaultEmail?: string;
    onSendClick: (email: string) => void;
    loading?: boolean;
}

const VerificationEmailInput = ({ defaultEmail = '', onSendClick, loading }: Props) => {
    const [email, setEmail] = useState(defaultEmail);
    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (onFormSubmit()) {
                    onSendClick(email);
                }
            }}
        >
            <div className="mb1">
                <InputFieldTwo
                    id="email"
                    error={validator([requiredValidator(email)])}
                    disableChange={loading}
                    type="email"
                    autoFocus
                    value={email}
                    onValue={setEmail}
                    placeholder={c('Placeholder').t`Email`}
                />
            </div>
            <div>
                <PrimaryButton type="submit" disabled={!email} loading={loading}>{c('Action').t`Send`}</PrimaryButton>
            </div>
        </form>
    );
};

export default VerificationEmailInput;
