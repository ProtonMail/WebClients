import { c } from 'ttag';
import { useState, useEffect } from 'react';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import {
    Button,
    Tabs,
    useLoading,
    useFormErrors,
    PhoneInput,
    InputFieldTwo,
    TextAreaTwo,
    useModals,
} from '@proton/components';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';
import { RecoveryMethod } from '@proton/components/containers/resetPassword/interface';
import { validateMnemonic } from '@proton/shared/lib/mnemonic';
import { useHistory } from 'react-router-dom';
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
    const { createModal } = useModals();
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
    const [mnemonic, setMnemonic] = useState(defaultMethod === 'mnemonic' ? defaultValue : '');
    const [mnemonicError, setMnemonicError] = useState('');

    const recoveryMethods = [
        methods?.includes('email') || methods?.includes('login') ? ('email' as const) : undefined,
        methods?.includes('sms') ? ('sms' as const) : undefined,
        methods?.includes('mnemonic') ? ('mnemonic' as const) : undefined,
    ].filter(isTruthy);

    const InvalidPassphraseError = c('Error').t`Wrong recovery phrase. Try again or use another recovery method.`;

    useEffect(() => {
        validateMnemonic(mnemonic)
            .then((isValid) => setMnemonicError(!isValid ? InvalidPassphraseError : ''))
            .catch(() => setMnemonicError(''));
    }, [mnemonic]);

    const currentMethod = recoveryMethods[tabIndex];

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async (data: { method: RecoveryMethod; value: string }) => {
        if (data.method !== 'mnemonic') {
            return onSubmit(data);
        }
        await new Promise<void>((resolve, reject) => {
            createModal(<MnemonicResetPasswordConfirmModal onClose={reject} onConfirm={resolve} />);
        });
        return onSubmit(data);
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                const value = (() => {
                    if (currentMethod === 'mnemonic') {
                        return mnemonic;
                    }
                    if (currentMethod === 'sms') {
                        return phone;
                    }
                    if (currentMethod === 'email') {
                        return email;
                    }
                    throw new Error('Missing method');
                })();
                return withLoading(
                    handleSubmit({
                        method: currentMethod,
                        value,
                    })
                ).catch(noop);
            }}
        >
            <div className="mb1-75">
                {(() => {
                    if (!recoveryMethods.length) {
                        return c('Info').t`Unfortunately there is no recovery method saved for this account.`;
                    }
                    if (currentMethod === 'mnemonic') {
                        return c('Info').t`Enter the recovery phrase associated with your ${BRAND_NAME} Account.`;
                    }
                    const recoveryMethodText =
                        currentMethod === 'email'
                            ? c('Recovery method').t`email address`
                            : c('Recovery method').t`phone number`;
                    return c('Info')
                        .t`Enter the recovery ${recoveryMethodText} associated with your ${BRAND_NAME} Account. We will send you a code to confirm the password reset.`;
                })()}
            </div>
            <Tabs
                tabs={[
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
                    recoveryMethods.includes('mnemonic') && {
                        title: c('Recovery method').t`Recovery phrase`,
                        content: (
                            <InputFieldTwo
                                id="mnemonic"
                                bigger
                                as={TextAreaTwo}
                                rows={3}
                                label={c('Label').t`Recovery phrase`}
                                placeholder={c('Label').t`Your recovery phrase`}
                                assistiveText={c('Label').t`Recovery phrase contains 12 words`}
                                disableChange={loading}
                                value={mnemonic}
                                onValue={(newValue: string) => {
                                    const splittedWords = newValue.split(/\s+/);
                                    return setMnemonic(splittedWords.slice(0, 12).join(' '));
                                }}
                                autoFocus
                                error={validator(
                                    currentMethod === 'mnemonic'
                                        ? [
                                              requiredValidator(mnemonic),
                                              (() => {
                                                  const splitWords = mnemonic.split(/\s+/);
                                                  return splitWords.length !== 12 ? InvalidPassphraseError : '';
                                              })(),
                                              (() => {
                                                  return mnemonicError;
                                              })(),
                                          ]
                                        : []
                                )}
                            />
                        ),
                    },
                ].filter(isTruthy)}
                value={tabIndex}
                onChange={(newIndex: number) => {
                    if (loading) {
                        return;
                    }
                    if (currentMethod === 'email') {
                        setEmail('');
                    }
                    if (currentMethod === 'sms') {
                        setPhone('');
                    }
                    if (currentMethod === 'mnemonic') {
                        setMnemonic('');
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
