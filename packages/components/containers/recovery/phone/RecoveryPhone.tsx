import type { FormEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';

import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PhoneInput from '@proton/components/components/v2/phone/LazyPhoneInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { useDispatch } from '@proton/redux-shared-store';
import { updatePhone } from '@proton/shared/lib/api/settings';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { InputFieldProps } from '../../../components/v2/field/InputField';
import ConfirmRemovePhoneModal from './ConfirmRemovePhoneModal';
import VerifyRecoveryPhoneModal from './VerifyRecoveryPhoneModal';

interface RenderFormProps {
    className?: string;
    inputWidth?: string;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onReset: () => void;
    input: ReactNode;
    submitButtonProps: {
        type: 'submit';
        disabled: boolean;
        loading: boolean;
    };
    onVerify: () => void;
    onRemove: () => void;
}

const defaultRenderForm = ({ className, inputWidth, onSubmit, input, submitButtonProps }: RenderFormProps) => {
    return (
        <form className={clsx(['flex flex-wrap flex-column md:flex-row', className])} onSubmit={onSubmit}>
            <div
                className="mr-0 mb-4 md:mr-4 md:flex-1 min-w-custom"
                style={{ '--min-w-custom': inputWidth ?? '14em' }}
            >
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
    inputWidth?: string;
    onSuccess?: (updatedUserSettings: UserSettings) => void;
    autoFocus?: boolean;
    renderForm?: (props: RenderFormProps) => ReactNode;
    inputProps?: Partial<Pick<InputFieldProps<typeof PhoneInput>, 'label' | 'readOnly'>>;
    disableVerifyCta?: boolean;
    persistPasswordScope?: boolean;
    canSubmit?: (input: string) => boolean;
    autoStartVerificationFlowAfterSet?: boolean;
}

const RecoveryPhone = ({
    renderForm = defaultRenderForm,
    phone,
    hasReset,
    defaultCountry,
    className,
    inputWidth,
    onSuccess,
    autoFocus,
    inputProps,
    disableVerifyCta,
    persistPasswordScope = false,
    canSubmit,
    autoStartVerificationFlowAfterSet = false,
}: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const [input, setInput] = useState(phone.Value || '');
    const { createNotification } = useNotifications();
    const { onFormSubmit } = useFormErrors();
    const [verifyRecoveryPhoneModal, setVerifyRecoveryPhoneModalOpen, renderVerifyRecoveryPhoneModal] = useModalState();
    const [confirmModal, setConfirmModal, renderConfirmModal] = useModalState();
    const isSubmittingRef = useRef(false);

    const [updatingPhone, withUpdatingPhone] = useLoading();

    const loading = renderVerifyRecoveryPhoneModal || renderConfirmModal || updatingPhone;

    const handleUpdatePhone = async (nextPhone = input) => {
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(
            updatePhone({
                Phone: nextPhone,
                PersistPasswordScope: persistPasswordScope,
            })
        );
        dispatch(userSettingsActions.set({ UserSettings }));
        createNotification({ text: c('Success').t`Phone number updated` });
        setInput(nextPhone);

        if (
            autoStartVerificationFlowAfterSet &&
            nextPhone &&
            nextPhone !== phone.Value &&
            UserSettings.Phone.Status !== SETTINGS_STATUS.VERIFIED
        ) {
            setVerifyRecoveryPhoneModalOpen(true);
        }

        onSuccess?.(UserSettings);
    };

    const submitPhoneUpdate = (nextPhone = input) => {
        if (isSubmittingRef.current) {
            return;
        }
        if (canSubmit && !canSubmit(nextPhone)) {
            return;
        }
        if (!nextPhone && hasReset) {
            setConfirmModal(true);
            return;
        }
        isSubmittingRef.current = true;
        void withUpdatingPhone(() => handleUpdatePhone(nextPhone)).finally(() => {
            isSubmittingRef.current = false;
        });
    };

    return (
        <>
            {renderConfirmModal && (
                <ConfirmRemovePhoneModal
                    {...confirmModal}
                    onConfirm={() => withUpdatingPhone(() => handleUpdatePhone(''))}
                />
            )}
            {renderVerifyRecoveryPhoneModal && <VerifyRecoveryPhoneModal phone={phone} {...verifyRecoveryPhoneModal} />}
            {renderForm({
                className,
                inputWidth,
                onSubmit: (e) => {
                    e.preventDefault();
                    if (!onFormSubmit()) {
                        return;
                    }
                    submitPhoneUpdate(input);
                },
                onReset: () => setInput(phone.Value || ''),
                onVerify: () => setVerifyRecoveryPhoneModalOpen(true),
                onRemove: () => submitPhoneUpdate(''),
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
                                    <IcExclamationCircleFilled className="color-danger shrink-0 aligntop mr-1" />
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
                                    <IcCheckmarkCircleFilled className="color-success shrink-0 aligntop mr-1" />
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
