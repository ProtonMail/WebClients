import { c } from 'ttag';
import React, { useState } from 'react';
import { BRAND_NAME } from 'proton-shared/lib/constants';
import { Button, Tabs, useLoading, useFormErrors, PhoneInput, InputFieldTwo } from 'react-components';
import { ResetPasswordState, ResetPasswordSetters } from 'react-components/containers/resetPassword/useResetPassword';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';
import { noop } from 'proton-shared/lib/helpers/function';

interface Props {
    onSubmit: () => Promise<void>;
    state: ResetPasswordState;
    setters: ResetPasswordSetters;
    defaultCountry?: string;
}

const RequestResetTokenForm = ({ onSubmit, defaultCountry, state, setters: stateSetters }: Props) => {
    const [loading, withLoading] = useLoading();
    const { methods } = state;
    const [tabIndex, setTabIndex] = useState(0);

    const recoveryMethods = [
        methods?.includes('email') || methods?.includes('login') ? 'email' : undefined,
        methods?.includes('sms') ? 'sms' : undefined,
    ].filter(isTruthy);

    const currentMethod = recoveryMethods[tabIndex];

    const { validator, onFormSubmit } = useFormErrors();

    const recoveryMethodText =
        currentMethod === 'email' ? c('Recovery method').t`email address` : c('Recovery method').t`phone number`;

    const handleChangeIndex = (newIndex: number) => {
        if (loading) {
            return;
        }
        if (currentMethod === 'email') {
            stateSetters.email('');
        }
        if (currentMethod === 'sms') {
            stateSetters.phone('');
        }
        setTabIndex(newIndex);
    };

    const tabs = [
        recoveryMethods.includes('email') && {
            title: c('Recovery method').t`Email`,
            content: (
                <InputFieldTwo
                    id="email"
                    bigger
                    label={c('Label').t`Recovery email`}
                    error={validator(currentMethod === 'email' ? [requiredValidator(state.email)] : [])}
                    disableChange={loading}
                    type="email"
                    autoFocus
                    value={state.email}
                    onValue={stateSetters.email}
                />
            ),
        },
        recoveryMethods.includes('sms') && {
            title: c('Recovery method').t`Phone number`,
            content: (
                <InputFieldTwo
                    as={PhoneInput}
                    id="phone"
                    bigger
                    label={c('Label').t`Recovery phone`}
                    error={validator(currentMethod === 'phone' ? [requiredValidator(state.phone)] : [])}
                    defaultCountry={defaultCountry}
                    disableChange={loading}
                    autoFocus
                    value={state.phone}
                    onChange={stateSetters.phone}
                />
            ),
        },
    ].filter(isTruthy);

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
            <div className="mb1-75">
                {!recoveryMethods.length
                    ? c('Info').t`Unfortunately there is no recovery method saved for this account.`
                    : c('Info')
                          .t`Enter the recovery ${recoveryMethodText} associated with your ${BRAND_NAME} Account. We will send you a code to confirm the password reset.`}
            </div>
            <Tabs tabs={tabs} value={tabIndex} onChange={handleChangeIndex} />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                {c('Action').t`Send code`}
            </Button>
        </form>
    );
};

export default RequestResetTokenForm;
