import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AlertModal,
    AlertModalProps,
    Checkbox,
    InputFieldTwo,
    PhoneInput,
    useApi,
    useFormErrors,
    useLoading,
    useModalState,
} from '@proton/components';
import { validateEmail, validatePhone } from '@proton/shared/lib/api/core/validate';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';

interface RecoveryConfirmModalProps extends Omit<AlertModalProps, 'buttons' | 'children' | 'title'> {
    onConfirm: () => void;
}

const RecoveryConfirmModal = ({ onConfirm, ...rest }: RecoveryConfirmModalProps) => {
    return (
        <AlertModal
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
        </AlertModal>
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
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [loadingDiscard, withLoadingDiscard] = useLoading();
    const [recoveryPhone, setRecoveryPhone] = useState(defaultPhone || '');
    const [recoveryEmail, setRecoveryEmail] = useState(defaultEmail || '');
    const [savePhone, setSavePhone] = useState(!!defaultPhone);
    const [saveEmail, setSaveEmail] = useState(!!defaultEmail);
    const [confirmModal, setConfirmModal, renderConfirmModal] = useModalState();

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
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
                    <div className="flex mb0-5">
                        <div className="flex-item-noshrink">
                            <Checkbox
                                id="save-phone"
                                checked={savePhone}
                                onChange={loading ? noop : () => setSavePhone(!savePhone)}
                            >
                                <span className="sr-only">{c('Label').t`Use a recovery phone number`}</span>
                            </Checkbox>
                        </div>
                        <div className="flex-item-fluid pl0-5 mt0-1">
                            <InputFieldTwo
                                as={PhoneInput}
                                id="recovery-phone"
                                bigger
                                label={c('Label').t`Recovery phone number`}
                                error={validator(savePhone ? [requiredValidator(recoveryPhone)] : [])}
                                disableChange={loading}
                                autoFocus
                                defaultCountry={defaultCountry}
                                value={recoveryPhone}
                                onChange={(value: string) => {
                                    setRecoveryPhone(value);
                                    setSavePhone(!!value);
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex">
                        <div className="flex-item-noshrink">
                            <Checkbox
                                id="save-email"
                                checked={saveEmail}
                                onChange={loading ? noop : () => setSaveEmail(!saveEmail)}
                            >
                                <span className="sr-only">{c('Label').t`Use a recovery email address`}</span>
                            </Checkbox>
                        </div>
                        <div className="flex-item-fluid pl0-5 mt0-1">
                            <InputFieldTwo
                                id="recovery-email"
                                bigger
                                label={c('Label').t`Recovery email address`}
                                error={validator(
                                    saveEmail ? [requiredValidator(recoveryEmail), emailValidator(recoveryEmail)] : []
                                )}
                                autoFocus
                                disableChange={loading}
                                type="email"
                                value={recoveryEmail}
                                onValue={(value: string) => {
                                    setRecoveryEmail(value);
                                    setSaveEmail(!!value);
                                }}
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
                        className="mt1-5"
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
                        className="mt0-5"
                    >
                        {c('Action').t`Maybe later`}
                    </Button>
                </form>
            </Content>
        </Main>
    );
};
export default RecoveryStep;
