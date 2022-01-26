import { KeyboardEvent, useState } from 'react';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { Api } from '@proton/shared/lib/interfaces';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { Button, useFormErrors, InputFieldTwo } from '../../../components';
import { useLoading } from '../../../hooks';

interface Props {
    onSubmit: (email: string) => Promise<void>;
    defaultEmail?: string;
    api: Api;
}

const EmailMethodForm = ({ onSubmit, defaultEmail = '' }: Props) => {
    const [email, setEmail] = useState(defaultEmail);
    const [loading, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }
        await onSubmit(email);
    };

    return (
        <>
            <InputFieldTwo
                id="email"
                bigger
                label={c('Label').t`Email address`}
                error={validator([requiredValidator(email), emailValidator(email)])}
                disableChange={loading}
                autoFocus
                type="email"
                value={email}
                onValue={(value: string) => {
                    setEmail(value);
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
                className="mt1-75"
            >
                {c('Action').t`Get verification code`}
            </Button>
        </>
    );
};

export default EmailMethodForm;
