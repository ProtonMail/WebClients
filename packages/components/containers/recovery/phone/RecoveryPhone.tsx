import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PhoneInput from '@proton/components/components/v2/phone/PhoneInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import { updatePhone } from '@proton/shared/lib/api/settings';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { InputFieldProps } from '../../../components/v2/field/InputField';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import ConfirmRemovePhoneModal from './ConfirmRemovePhoneModal';
import VerifyRecoveryPhoneModal from './VerifyRecoveryPhoneModal';

interface RenderFormProps {
    className?: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    input: ReactNode;
    submitButtonProps: {
        type: 'submit';
        disabled: boolean;
        loading: boolean;
    };
}

const defaultRenderForm = ({ className, onSubmit, input, submitButtonProps }: RenderFormProps) => {
    return (
        <form className={clsx(['flex flex-wrap flex-column md:flex-row', className])} onSubmit={onSubmit}>
            <div className="mr-0 mb-4 md:mr-4 md:flex-1 min-w-custom" style={{ '--min-w-custom': '14em' }}>
                {input}
            </div>
            <div className="mb-2">
                <Button shape="outline" data-testid="account:recovery:phoneSubmit" {...submitButtonProps}>
                    {c('Action').t`Save`}
                </Button>
            </div>
        </form>
    );
};

interface Props {
    phone: UserSettings['Phone'];
    hasReset: boolean;
    defaultCountry?: string;
    className?: string;
    onSuccess?: () => void;
    autoFocus?: boolean;
    renderForm?: (props: RenderFormProps) => ReactNode;
    inputProps?: Partial<Pick<InputFieldProps<typeof PhoneInput>, 'label'>>;
    disableVerifyCta?: boolean;
    persistPasswordScope?: boolean;
}

const RecoveryPhone = ({
    renderForm = defaultRenderForm,
    phone,
    hasReset,
    defaultCountry,
    className,
    onSuccess,
    autoFocus,
    inputProps,
    disableVerifyCta,
    persistPasswordScope = false,
}: Props) => {
    const api = useApi();
    const [input, setInput] = useState(phone.Value || '');
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { onFormSubmit } = useFormErrors();
    const [verifyRecoveryPhoneModal, setVerifyRecoveryPhoneModalOpen, renderVerifyRecoveryPhoneModal] = useModalState();
    const [confirmModal, setConfirmModal, renderConfirmModal] = useModalState();

    const [updatingPhone, withUpdatingPhone] = useLoading();

    const confirmStep = !input && hasReset;
    const loading = renderVerifyRecoveryPhoneModal || renderConfirmModal || updatingPhone;

    const handleUpdatePhone = async () => {
        await api(
            updatePhone({
                Phone: input,
                PersistPasswordScope: persistPasswordScope,
            })
        );
        await call();

        createNotification({ text: c('Success').t`Phone number updated` });
        onSuccess?.();
    };

    return (
        <>
            {renderConfirmModal && (
                <ConfirmRemovePhoneModal {...confirmModal} onConfirm={() => withUpdatingPhone(handleUpdatePhone)} />
            )}
            {renderVerifyRecoveryPhoneModal && <VerifyRecoveryPhoneModal phone={phone} {...verifyRecoveryPhoneModal} />}
            {renderForm({
                className,
                onSubmit: (e) => {
                    e.preventDefault();
                    if (!onFormSubmit()) {
                        return;
                    }
                    if (confirmStep) {
                        setConfirmModal(true);
                    } else {
                        void withUpdatingPhone(handleUpdatePhone);
                    }
                },
                input: (
                    <InputFieldTwo
                        as={PhoneInput}
                        id="phoneInput"
                        disableChange={loading}
                        autoFocus={autoFocus}
                        defaultCountry={defaultCountry}
                        value={input}
                        onChange={setInput}
                        aria-label={c('label').t`Recovery phone number`}
                        assistiveText={
                            !disableVerifyCta &&
                            phone.Value &&
                            (phone.Status !== SETTINGS_STATUS.VERIFIED ? (
                                <>
                                    <Icon
                                        className="color-danger shrink-0 aligntop mr-1"
                                        name="exclamation-circle-filled"
                                    />
                                    <span className="color-norm mr-2">{c('Recovery Phone')
                                        .t`Phone number not yet verified.`}</span>
                                    <button
                                        className="link"
                                        type="button"
                                        onClick={() => setVerifyRecoveryPhoneModalOpen(true)}
                                        aria-label={c('Recovery Phone')
                                            .t`Verify this recovery phone number now: ${phone.Value}`}
                                    >
                                        {c('Recovery Phone').t`Verify now`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Icon
                                        className="color-success shrink-0 aligntop mr-1"
                                        name="checkmark-circle-filled"
                                    />
                                    <span className="mr-2">{c('Recovery Phone')
                                        .t`Phone number has been verified.`}</span>
                                </>
                            ))
                        }
                        {...inputProps}
                    />
                ),
                submitButtonProps: {
                    type: 'submit',
                    disabled: (phone.Value || '') === input,
                    loading,
                },
            })}
        </>
    );
};

export default RecoveryPhone;
