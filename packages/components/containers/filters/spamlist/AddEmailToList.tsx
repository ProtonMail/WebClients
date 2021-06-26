import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { EMAIL_PLACEHOLDER } from '@proton/shared/lib/constants';
import { EmailInput, Label, Row, Field } from '../../../components';

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
                    placeholder={EMAIL_PLACEHOLDER}
                    required
                    autoFocus
                />
            </Field>
        </Row>
    );
}

export default AddEmailToList;
