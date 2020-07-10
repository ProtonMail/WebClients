import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { EmailInput, Label, Row, Field } from '../../..';
import { EXTERNAL_EMAIL_PLACEHOLDER } from 'proton-shared/lib/constants';

interface Props {
    email: string;
    onChange: (newEmail: string) => void;
}

function AddEmailToList({ email, onChange }: Props) {
    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => onChange(target.value);

    return (
        <Row>
            <Label htmlFor="email">{c('Label').t`Email`}</Label>
            <Field>
                <EmailInput
                    id="email"
                    value={email}
                    onChange={handleChange}
                    placeholder={EXTERNAL_EMAIL_PLACEHOLDER}
                    required={true}
                    autoFocus={true}
                />
            </Field>
        </Row>
    );
}

export default AddEmailToList;
