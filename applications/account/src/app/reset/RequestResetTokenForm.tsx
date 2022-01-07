import { c } from 'ttag';
import { useState } from 'react';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { Button, Icon, Tabs, useLoading, useFormErrors, PhoneInput, InputFieldTwo } from '@proton/components';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';
import { RecoveryMethod } from '@proton/components/containers/resetPassword/interface';
import { useHistory } from 'react-router-dom';
import MnemonicInputField, {
    useMnemonicInputValidation,
} from '@proton/components/containers/mnemonic/MnemonicInputField';
import MnemonicResetPasswordConfirmModal from './MnemonicResetPasswordConfirmModal';

interface Props {
    onSubmit: (value: { method: RecoveryMethod; value: string }) => Promise<void>;
    defaultCountry?: string;
    methods: RecoveryMethod[];
    defaultMethod?: RecoveryMethod;
    defaultValue?: string;
}

const RequestResetTokenForm = ({ onSubmit, defaultCountry, methods, defaultMethod, defaultValue = '' }: Props) => {
    const history = useHistory();
    const [loading, withLoading] = useLoading();

    const recoveryMethods = [
        methods?.includes('mnemonic') ? ('mnemonic' as const) : undefined,
        methods?.includes('email') || methods?.includes('login') ? ('email' as const) : undefined,
        methods?.includes('sms') ? ('sms' as const) : undefined,
    ].filter(isTruthy);

    const [tabIndex, setTabIndex] = useState(() => {
        if (defaultMethod === undefined) {
            return 0;
        }
        if (defaultMethod === 'login') {
            defaultMethod = 'email';
        }
        const foundMethod = recoveryMethods.indexOf(defaultMethod);
        return foundMethod !== -1 ? foundMethod : 0;
    });

    const [email, setEmail] = useState(defaultMethod === 'email' ? defaultValue : '');
    const [phone, setPhone] = useState(defaultMethod === 'sms' ? defaultValue : '');
    const [mnemonic, setMnemonic] = useState(defaultMethod === 'mnemonic' ? defaultValue : '');
    const [mnemonicResetConfirmModal, setMnemonicResetConfirmModal] = useState(false);
    const mnemonicValidation = useMnemonicInputValidation(mnemonic);

    const currentMethod = recoveryMethods[tabIndex];

    const { validator, onFormSubmit } = useFormErrors();

    const boldWarning = (
        <b key="bold-warning-text" className="color-danger">{
            // translator: Full sentence is 'Warning: You will lose access to all current encrypted data in your account if you continue.'
            c('Info').t`Warning:`
        }</b>
    );

    // translator: Full sentence is 'Warning: You will lose access to all current encrypted data in your account if you continue.'
    const warningText = c('Info')
        .jt`${boldWarning} You will lose access to all current encrypted data in your account if you continue.`;

    const recommendRecoveryPhraseText = recoveryMethods.includes('mnemonic')
        ? c('Info').t`We recommend using your recovery phrase instead.`
        : '';

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                if (currentMethod === 'mnemonic') {
                    setMnemonicResetConfirmModal(true);
                    return;
                }
                const value = (() => {
                    if (currentMethod === 'email') {
                        return email;
                    }
                    if (currentMethod === 'sms') {
                        return phone;
                    }
                    throw new Error('Missing method');
                })();
                withLoading(
                    onSubmit({
                        method: currentMethod,
                        value,
                    })
                ).catch(noop);
            }}
        >
            <MnemonicResetPasswordConfirmModal
                onClose={() => setMnemonicResetConfirmModal(false)}
                onConfirm={() => {
                    withLoading(
                        onSubmit({
                            method: 'mnemonic',
                            value: mnemonic,
                        })
                    ).catch(noop);
                }}
                open={mnemonicResetConfirmModal}
            />
            {(() => {
                if (recoveryMethods.length === 1) {
                    return;
                }

                return (
                    <div className="mb1-75">
                        {!recoveryMethods.length
                            ? c('Info').t`Unfortunately there is no recovery method saved for this account.`
                            : c('Info').t`To proceed, select an account recovery method so we can verify the request.`}
                    </div>
                );
            })()}
            <Tabs
                tabs={[
                    recoveryMethods.includes('mnemonic') && {
                        title: c('Recovery method').t`Phrase`,
                        content: (
                            <>
                                <div className="mb1">
                                    {c('Info')
                                        .t`Please enter the 12-word recovery phrase associated with your account.`}
                                </div>
                                <MnemonicInputField
                                    disableChange={loading}
                                    value={mnemonic}
                                    onValue={setMnemonic}
                                    autoFocus
                                    error={validator(
                                        currentMethod === 'mnemonic'
                                            ? [requiredValidator(mnemonic), ...mnemonicValidation]
                                            : []
                                    )}
                                />
                            </>
                        ),
                    },
                    recoveryMethods.includes('email') && {
                        title: c('Recovery method').t`Email`,
                        content: (
                            <>
                                <div className="mb1">
                                    {c('Info')
                                        .t`We’ll send a reset code to the email address you provided for account recovery.`}
                                </div>
                                <div className="mb1">
                                    <Icon
                                        className="color-danger mr0-5 float-left mt0-25"
                                        name="circle-exclamation-filled"
                                        size={14}
                                    />
                                    {warningText} {recommendRecoveryPhraseText}
                                </div>
                                <InputFieldTwo
                                    key="email"
                                    id="email"
                                    bigger
                                    label={c('Label').t`Recovery email address`}
                                    error={validator(currentMethod === 'email' ? [requiredValidator(email)] : [])}
                                    disableChange={loading}
                                    type="email"
                                    autoFocus
                                    value={email}
                                    onValue={setEmail}
                                />
                            </>
                        ),
                    },
                    recoveryMethods.includes('sms') && {
                        title: c('Recovery method').t`Phone number`,
                        content: (
                            <>
                                <div className="mb1">
                                    {c('Info')
                                        .t`We’ll send a reset code to the phone number you provided for account recovery.`}
                                </div>
                                <div className="mb1">
                                    <Icon
                                        className="color-danger mr0-5 float-left mt0-25"
                                        name="circle-exclamation-filled"
                                        size={14}
                                    />
                                    {warningText} {recommendRecoveryPhraseText}
                                </div>
                                <InputFieldTwo
                                    key="phone"
                                    as={PhoneInput}
                                    id="phone"
                                    bigger
                                    label={c('Label').t`Recovery phone number`}
                                    error={validator(currentMethod === 'sms' ? [requiredValidator(phone)] : [])}
                                    defaultCountry={defaultCountry}
                                    disableChange={loading}
                                    autoFocus
                                    value={phone}
                                    onChange={setPhone}
                                />
                            </>
                        ),
                    },
                ].filter(isTruthy)}
                value={tabIndex}
                onChange={(newIndex: number) => {
                    if (loading) {
                        return;
                    }
                    if (currentMethod === 'mnemonic') {
                        setMnemonic('');
                    }
                    if (currentMethod === 'email') {
                        setEmail('');
                    }
                    if (currentMethod === 'sms') {
                        setPhone('');
                    }
                    setTabIndex(newIndex);
                }}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                {currentMethod === 'mnemonic' ? c('Action').t`Reset password` : c('Action').t`Send code`}
            </Button>
            <Button
                size="large"
                color="norm"
                shape="ghost"
                fullWidth
                className="mt0-5"
                onClick={() => history.push(SSO_PATHS.LOGIN)}
            >{c('Action').t`Return to sign in`}</Button>
        </form>
    );
};

export default RequestResetTokenForm;
