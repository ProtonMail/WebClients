import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PhoneInput from '@proton/components/components/v2/phone/PhoneInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (phone: string) => Promise<void>;
    defaultPhone?: string;
    defaultCountry?: string;
    isEmbedded?: boolean;
    api: Api;
}

const PhoneMethodForm = ({ onSubmit, defaultPhone = '', defaultCountry, isEmbedded }: Props) => {
    const [phone, setPhone] = useState(defaultPhone);
    const [loading, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }
        await onSubmit(phone);
    };

    return (
        <>
            <InputFieldTwo
                as={PhoneInput}
                id="phone"
                embedded={isEmbedded}
                bigger
                label={c('Label').t`Phone number`}
                error={validator([requiredValidator(phone)])}
                disableChange={loading}
                autoFocus
                defaultCountry={defaultCountry}
                value={phone}
                onChange={(value: string) => {
                    setPhone(value);
                }}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
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
                className="mt-6"
            >
                {c('Action').t`Get verification code`}
            </Button>
        </>
    );
};

export default PhoneMethodForm;
