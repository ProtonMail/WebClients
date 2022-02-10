import { c } from 'ttag';
import { useState } from 'react';
import { Button, useFormErrors, useLoading, InputFieldTwo } from '@proton/components';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';

interface Props {
    onSubmit: (username: string) => Promise<void>;
    defaultUsername?: string;
    loading: boolean;
}

const RequestRecoveryForm = ({ onSubmit, defaultUsername = '', loading: outerLoading }: Props) => {
    const [innerLoading, withLoading] = useLoading();
    const [username, setUsername] = useState(defaultUsername);

    const { validator, onFormSubmit } = useFormErrors();

    const loading = innerLoading || outerLoading;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(username)).catch(noop);
            }}
        >
            <InputFieldTwo
                id="username"
                bigger
                label={c('Label').t`Email or username`}
                error={validator([requiredValidator(username)])}
                disableChange={loading}
                value={username}
                onValue={setUsername}
                autoFocus
            />
            <Button size="large" color="norm" loading={loading} type="submit" fullWidth className="mt1-75">{c('Action')
                .t`Next`}</Button>
        </form>
    );
};

export default RequestRecoveryForm;
