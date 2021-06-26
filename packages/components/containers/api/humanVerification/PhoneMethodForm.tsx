import { c } from 'ttag';
import React, { useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { Api } from 'proton-shared/lib/interfaces';
import { validatePhone } from 'proton-shared/lib/api/core/validate';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';
import { Button, useFormErrors, PhoneInput, InputFieldTwo } from '../../../components';
import { useLoading } from '../../../hooks';

interface Props {
    onSubmit: (phone: string) => Promise<void>;
    defaultPhone?: string;
    defaultCountry?: string;
    api: Api;
}

const EmailMethodForm = ({ api, onSubmit, defaultPhone = '', defaultCountry }: Props) => {
    const [phone, setPhone] = useState(defaultPhone);
    const [loading, withLoading] = useLoading();
    const [phoneError, setPhoneError] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }

        try {
            await api(validatePhone(phone));
        } catch (error) {
            setPhoneError(getApiErrorMessage(error) || c('Error').t`Can't validate phone, try again later`);
            throw error;
        }

        await onSubmit(phone);
    };

    return (
        <>
            <InputFieldTwo
                as={PhoneInput}
                id="phone"
                bigger
                label={c('Label').t`Phone number`}
                error={validator([requiredValidator(phone), phoneError])}
                disableChange={loading}
                autoFocus
                defaultCountry={defaultCountry}
                value={phone}
                onChange={(value: string) => {
                    setPhoneError('');
                    setPhone(value);
                }}
                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        withLoading(handleSubmit()).catch(noop);
                    }
                }}
            />
            <Button
                size="large"
                color="norm"
                type="button"
                fullWidth
                loading={loading}
                onClick={() => withLoading(handleSubmit()).catch(noop)}
                className="mt1-75"
            >
                {c('Action').t`Get verification code`}
            </Button>
        </>
    );
};

export default EmailMethodForm;
