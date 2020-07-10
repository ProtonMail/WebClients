import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { Input, Label, Row, Field } from '../../..';
import { DOMAIN_PLACEHOLDER } from 'proton-shared/lib/constants';
import { isDomain } from 'proton-shared/lib/helpers/validators';

interface Props {
    domain: string;
    onChange: (newDomain: string) => void;
}

const AddDomainToList = ({ domain, onChange }: Props) => {
    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => onChange(target.value);
    const error = domain
        ? isDomain(domain)
            ? ''
            : c('Error').t`Invalid domain`
        : c('Error').t`This field is required`;
    return (
        <Row>
            <Label htmlFor="domain">{c('Label').t`Domain`}</Label>
            <Field>
                <Input
                    id="domain"
                    value={domain}
                    onChange={handleChange}
                    placeholder={DOMAIN_PLACEHOLDER}
                    error={error}
                    required={true}
                    autoFocus={true}
                />
            </Field>
        </Row>
    );
};

export default AddDomainToList;
