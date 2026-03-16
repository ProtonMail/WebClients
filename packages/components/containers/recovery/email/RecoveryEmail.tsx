import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { c } from 'ttag';

import { userSettingsActions, userSettingsThunk } from '@proton/account/userSettings';
import { Button } from '@proton/atoms/Button/Button';
import type { Input } from '@proton/atoms/Input/Input';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { useDispatch } from '@proton/redux-shared-store';
import { CacheType } from '@proton/redux-utilities';
import { updateEmail, updateResetEmail } from '@proton/shared/lib/api/settings';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/constants';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type { InputFieldProps } from '../../../components/v2/field/InputField';
import ConfirmRemoveEmailModal from './ConfirmRemoveEmailModal';
import VerifyRecoveryEmailModal from './VerifyRecoveryEmailModal';

interface RenderFormProps {
    className?: string;
    inputWidth?: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
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
        <form className={clsx('flex flex-wrap flex-column md:flex-row', className)} onSubmit={onSubmit}>
            <div
                className="mr-0 mb-4 md:mr-4 md:flex-1 min-w-custom"
                style={{ '--min-w-custom': inputWidth ?? '14rem' }}
            >
                {input}
            </div>
            <div className="mb-2">
                <Button shape="outline" data-testid="account:recovery:emailSubmit" {...submitButtonProps}>
                    {c('Action').t`Save`}
                </Button>
            </div>
        </form>
    );
};

interface Props {
    email: UserSettings['Email'];
    hasReset: boolean;
    hasNotify: boolean;
    className?: string;
    inputWidth?: string;
    onSuccess?: (updatedUserSettings: UserSettings) => void;
    autoFocus?: boolean;
    renderForm?: (props: RenderFormProps) => ReactNode;
    inputProps?: Partial<Pick<InputFieldProps<typeof Input>, 'label' | 'readOnly' | 'placeholder'>>;
    disableVerifyCta?: boolean;
    persistPasswordScope?: boolean;
    canSubmit?: (input: string) => boolean;
    autoStartVerificationFlowAfterSet?: boolean;
}

const RecoveryEmail = ({
    renderForm = defaultRenderForm,
    email,
    hasReset,
    hasNotify,
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
    const [input, setInput] = useState(email.Value || '');
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const [verifyRecoveryEmailModal, setVerifyRecoveryEmailModalOpen, renderVerifyRecoveryEmailModal] = useModalState();
    const [confirmModal, setConfirmModal, renderConfirmModal] = useModalState();
    const [updatingEmail, withUpdatingEmail] = useLoading();
    const isSubmittingRef = useRef(false);

    const loading = renderVerifyRecoveryEmailModal || renderConfirmModal || updatingEmail;
    const handleUpdateEmail = async (nextEmail = input) => {
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(
            updateEmail({
                Email: nextEmail,
                PersistPasswordScope: persistPasswordScope,
            })
        );

        dispatch(userSettingsActions.set({ UserSettings }));

        // TODO: temporarily included until BE takes care of it
        if (UserSettings.HighSecurity.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED) {
            await api(updateResetEmail({ Reset: 0, PersistPasswordScope: persistPasswordScope }));
            await dispatch(userSettingsThunk({ cache: CacheType.None }));
        }

        setInput(nextEmail);
        createNotification({ text: c('Success').t`Email updated` });

        if (
            autoStartVerificationFlowAfterSet &&
            nextEmail &&
            nextEmail !== email.Value &&
            UserSettings.Email.Status !== SETTINGS_STATUS.VERIFIED
        ) {
            setVerifyRecoveryEmailModalOpen(true);
        }

        onSuccess?.(UserSettings);
    };

    const submitEmailUpdate = (nextEmail = input) => {
        if (isSubmittingRef.current) {
            return;
        }
        if (canSubmit && !canSubmit(nextEmail)) {
            return;
        }
        if (!nextEmail && (hasReset || hasNotify)) {
            setConfirmModal(true);
            return;
        }
        isSubmittingRef.current = true;
        void withUpdatingEmail(() => handleUpdateEmail(nextEmail)).finally(() => {
            isSubmittingRef.current = false;
        });
    };

    return (
        <>
            {renderConfirmModal && (
                <ConfirmRemoveEmailModal
                    hasReset={hasReset}
                    hasNotify={hasNotify}
                    {...confirmModal}
                    onConfirm={() => withUpdatingEmail(() => handleUpdateEmail(''))}
                />
            )}
            {renderVerifyRecoveryEmailModal && (
                <VerifyRecoveryEmailModal email={{ ...email, Value: input }} {...verifyRecoveryEmailModal} />
            )}

            {renderForm({
                className,
                inputWidth,
                onVerify: () => setVerifyRecoveryEmailModalOpen(true),
                onRemove: () => submitEmailUpdate(''),
                onReset: () => setInput(email.Value || ''),
                onSubmit: (e) => {
                    e.preventDefault();
                    if (!onFormSubmit()) {
                        return;
                    }
                    submitEmailUpdate(input);
                },
                input: (
                    <InputFieldTwo
                        type="email"
                        autoComplete="email"
                        title={email.Value || ''}
                        autoFocus={autoFocus}
                        id="recovery-email-input"
                        disableChange={loading}
                        value={input || ''}
                        error={validator([input && emailValidator(input)].filter(isTruthy))}
                        onValue={setInput}
                        assistiveText={
                            !disableVerifyCta &&
                            email.Value &&
                            (email.Status !== SETTINGS_STATUS.VERIFIED ? (
                                <>
                                    <IcExclamationCircleFilled className="color-danger shrink-0 aligntop mr-1" />
                                    <span className="color-norm mr-2">{c('Recovery Email')
                                        .t`Email address not yet verified.`}</span>
                                    <button
                                        className="link"
                                        type="button"
                                        onClick={() => setVerifyRecoveryEmailModalOpen(true)}
                                        aria-label={c('Recovery Email')
                                            .t`Verify now this recovery email address: ${email.Value}`}
                                    >
                                        {c('Recovery Email').t`Verify now`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <IcCheckmarkCircleFilled className="color-success shrink-0 aligntop mr-1" />
                                    <span className="mr-2">{c('Recovery Email')
                                        .t`Email address has been verified.`}</span>
                                </>
                            ))
                        }
                        {...inputProps}
                    />
                ),
                submitButtonProps: {
                    type: 'submit',

                    disabled: (email.Value || '') === input,
                    loading,
                },
            })}
        </>
    );
};

export default RecoveryEmail;
