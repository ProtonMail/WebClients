import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (username: string) => Promise<void>;
    defaultUsername?: string;
    loading: boolean;
    loginUrl: string;
}

const RequestRecoveryForm = ({ onSubmit, defaultUsername = '', loading: outerLoading, loginUrl }: Props) => {
    const [innerLoading, withLoading] = useLoading();
    const history = useHistory();
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
                withLoading(onSubmit(username.trim())).catch(noop);
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
            <Button size="large" color="norm" loading={loading} type="submit" fullWidth className="mt-6">{c('Action')
                .t`Next`}</Button>
            <Button
                size="large"
                color="norm"
                shape="ghost"
                fullWidth
                className="mt-2"
                onClick={() => history.push(loginUrl)}
            >{c('Action').t`Return to sign in`}</Button>
        </form>
    );
};

export default RequestRecoveryForm;
