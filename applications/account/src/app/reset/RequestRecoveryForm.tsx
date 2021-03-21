import { c } from 'ttag';
import React from 'react';
import { Button, useFormErrors, useLoading, InputFieldTwo } from 'react-components';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';
import { ResetPasswordState, ResetPasswordSetters } from 'react-components/containers/resetPassword/useResetPassword';
import { noop } from 'proton-shared/lib/helpers/function';
import ButtonSpacer from '../public/ButtonSpacer';

interface Props {
    onSubmit: () => Promise<void>;
    state: ResetPasswordState;
    setters: ResetPasswordSetters;
}

const RequestRecoveryForm = ({ onSubmit, state, setters: stateSetters }: Props) => {
    const [loading, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            className="signup-form"
            onSubmit={(e) => {
                e.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit()).catch(noop);
            }}
        >
            <InputFieldTwo
                id="username"
                bigger
                label={c('Label').t`Email or username`}
                error={validator([requiredValidator(state.username)])}
                disableChange={loading}
                value={state.username}
                onValue={stateSetters.username}
                autoFocus
            />
            <ButtonSpacer>
                <Button size="large" color="norm" loading={loading} type="submit" fullWidth>{c('Action')
                    .t`Next`}</Button>
            </ButtonSpacer>
        </form>
    );
};

export default RequestRecoveryForm;
