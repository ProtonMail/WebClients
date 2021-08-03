import { c } from 'ttag';
import { useState } from 'react';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { Button, Tabs, useLoading, useFormErrors, PhoneInput, InputFieldTwo } from '@proton/components';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';
import { RecoveryMethod } from '@proton/components/containers/resetPassword/interface';

interface Props {
    onSubmit: (value: { method: RecoveryMethod; value: string }) => Promise<void>;
    defaultCountry?: string;
    methods: RecoveryMethod[];
    defaultMethod?: RecoveryMethod;
    defaultValue?: string;
}

const RequestResetTokenForm = ({ onSubmit, defaultCountry, methods, defaultMethod, defaultValue = '' }: Props) => {
    const [loading, withLoading] = useLoading();
    const [tabIndex, setTabIndex] = useState(() => {
        if (defaultMethod === undefined) {
            return 0;
        }
        const foundMethod = methods.indexOf(defaultMethod);
        return foundMethod !== -1 ? foundMethod : 0;
    });
    const [email, setEmail] = useState(defaultMethod === 'email' ? defaultValue : '');
    const [phone, setPhone] = useState(defaultMethod === 'sms' ? defaultValue : '');

    const recoveryMethods: ('sms' | 'email')[] = [
        methods?.includes('email') || methods?.includes('login') ? ('email' as const) : undefined,
        methods?.includes('sms') ? ('sms' as const) : undefined,
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
            setEmail('');
        }
        if (currentMethod === 'sms') {
            setPhone('');
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
                    error={validator(currentMethod === 'email' ? [requiredValidator(email)] : [])}
                    disableChange={loading}
                    type="email"
                    autoFocus
                    value={email}
                    onValue={setEmail}
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
                    error={validator(currentMethod === 'sms' ? [requiredValidator(phone)] : [])}
                    defaultCountry={defaultCountry}
                    disableChange={loading}
                    autoFocus
                    value={phone}
                    onChange={setPhone}
                />
            ),
        },
    ].filter(isTruthy);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(
                    onSubmit({
                        method: currentMethod,
                        value: currentMethod === 'sms' ? phone : email,
                    })
                ).catch(noop);
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
