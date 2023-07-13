import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Checkbox,
    InputFieldTwo,
    PhoneInput,
    Prompt,
    PromptProps,
    useApi,
    useConfig,
    useFormErrors,
    useModalState,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { validateEmail, validatePhone } from '@proton/shared/lib/api/core/validate';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';
import { getSignupApplication } from './helper';

interface RecoveryConfirmModalProps extends Omit<PromptProps, 'buttons' | 'children' | 'title'> {
    onConfirm: () => void;
}

const RecoveryConfirmModal = ({ onConfirm, ...rest }: RecoveryConfirmModalProps) => {
    return (
        <Prompt
            {...rest}
            title={c('Title').t`Warning`}
            buttons={[
                <Button
                    color="norm"
                    onClick={async () => {
                        rest.onClose?.();
                        onConfirm();
                    }}
                >{c('Action').t`Confirm`}</Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('Info')
                .t`You did not set a recovery method so account recovery is impossible if you forget your password. Proceed without recovery method?`}
        </Prompt>
    );
};

interface Props {
    onSubmit: (data: { recoveryPhone?: string; recoveryEmail?: string }) => Promise<void>;
    onBack?: () => void;
    defaultCountry?: string;
    defaultPhone?: string;
    defaultEmail?: string;
}

const RecoveryStep = ({ defaultPhone, defaultEmail, defaultCountry, onSubmit, onBack }: Props) => {
    const { APP_NAME } = useConfig();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [loadingDiscard, withLoadingDiscard] = useLoading();
    const [recoveryPhone, setRecoveryPhone] = useState(defaultPhone || '');
    const [recoveryEmail, setRecoveryEmail] = useState(defaultEmail || '');
    const [savePhone, setSavePhone] = useState(!!defaultPhone);
    const [saveEmail, setSaveEmail] = useState(!!defaultEmail);
    const [confirmModal, setConfirmModal, renderConfirmModal] = useModalState();
    const inputRecoveryPhoneRef = useRef<HTMLInputElement>(null);
    const inputRecoveryEmailRef = useRef<HTMLInputElement>(null);

    const { validator, onFormSubmit } = useFormErrors();

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'recovery',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    const phoneValidations = savePhone ? [requiredValidator(recoveryPhone)] : [];
    const emailValidations = saveEmail ? [requiredValidator(recoveryEmail), emailValidator(recoveryEmail)] : [];

    const handleSubmit = async () => {
        if (loading) {
            return;
        }

        if (!onFormSubmit()) {
            if (phoneValidations.some((validation) => !!validation)) {
                inputRecoveryPhoneRef.current?.focus();
            } else if (emailValidations.some((validation) => !!validation)) {
                inputRecoveryEmailRef.current?.focus();
            }
            return;
        }

        if (!saveEmail && !savePhone) {
            setConfirmModal(true);
            return;
        }

        if (saveEmail) {
            await api(validateEmail(recoveryEmail));
        }

        if (savePhone) {
            await api(validatePhone(recoveryPhone));
        }

        return onSubmit({
            recoveryPhone: savePhone ? recoveryPhone : undefined,
            recoveryEmail: saveEmail ? recoveryEmail : undefined,
        });
    };
    return (
        <Main>
            <Header title={c('Title').t`Save contact details`} onBack={onBack} />
            <Content>
                {renderConfirmModal && (
                    <RecoveryConfirmModal
                        onConfirm={() => {
                            return withLoadingDiscard(onSubmit({}));
                        }}
                        {...confirmModal}
                    />
                )}
                <Text>
                    {c('new_plans: signup')
                        .t`Save your email address or phone number to use for verification if you need to reset your account.`}
                </Text>
                <form
                    name="recoveryForm"
                    onSubmit={(e) => {
                        e.preventDefault();
                        withLoading(handleSubmit()).catch(noop);
                    }}
                    method="post"
                    autoComplete="off"
                    noValidate
                >
                    <div className="flex mb-2">
                        <div className="flex-item-noshrink">
                            <Checkbox
                                id="save-phone"
                                checked={savePhone}
                                onChange={
                                    loading
                                        ? noop
                                        : () => {
                                              const newValue = !savePhone;
                                              setSavePhone(newValue);
                                              if (newValue) {
                                                  inputRecoveryPhoneRef.current?.focus();
                                              }
                                          }
                                }
                            >
                                <span className="sr-only">{c('Label').t`Use a recovery phone number`}</span>
                            </Checkbox>
                        </div>
                        <div className="flex-item-fluid pl-2 mt-0.5">
                            <InputFieldTwo
                                as={PhoneInput}
                                id="recovery-phone"
                                bigger
                                label={c('Label').t`Recovery phone number`}
                                error={validator(phoneValidations)}
                                disableChange={loading}
                                autoFocus
                                defaultCountry={defaultCountry}
                                value={recoveryPhone}
                                onChange={(value: string) => {
                                    setRecoveryPhone(value);
                                    setSavePhone(!!value);
                                }}
                                ref={inputRecoveryPhoneRef}
                            />
                        </div>
                    </div>

                    <div className="flex">
                        <div className="flex-item-noshrink">
                            <Checkbox
                                id="save-email"
                                checked={saveEmail}
                                onChange={
                                    loading
                                        ? noop
                                        : () => {
                                              const newValue = !saveEmail;
                                              setSaveEmail(newValue);
                                              if (newValue) {
                                                  inputRecoveryEmailRef.current?.focus();
                                              }
                                          }
                                }
                            >
                                <span className="sr-only">{c('Label').t`Use a recovery email address`}</span>
                            </Checkbox>
                        </div>
                        <div className="flex-item-fluid pl-2 mt-0.5">
                            <InputFieldTwo
                                id="recovery-email"
                                bigger
                                label={c('Label').t`Recovery email address`}
                                error={validator(emailValidations)}
                                autoFocus
                                disableChange={loading}
                                type="email"
                                value={recoveryEmail}
                                onValue={(value: string) => {
                                    setRecoveryEmail(value);
                                    setSaveEmail(!!value);
                                }}
                                ref={inputRecoveryEmailRef}
                            />
                        </div>
                    </div>

                    <Button
                        size="large"
                        color="norm"
                        type="submit"
                        fullWidth
                        loading={loading}
                        disabled={loadingDiscard}
                        className="mt-6"
                    >
                        {c('Action').t`Save selected`}
                    </Button>
                    <Button
                        size="large"
                        color="norm"
                        shape="ghost"
                        type="button"
                        fullWidth
                        disabled={loading}
                        onClick={() => setConfirmModal(true)}
                        className="mt-2"
                    >
                        {c('Action').t`Maybe later`}
                    </Button>
                </form>
            </Content>
        </Main>
    );
};
export default RecoveryStep;
