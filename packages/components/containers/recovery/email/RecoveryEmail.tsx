import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { userSettingsActions, userSettingsThunk } from '@proton/account/userSettings';
import { Button } from '@proton/atoms/Button/Button';
import type { Input } from '@proton/atoms/Input/Input';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
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
    input: ReactNode;
    submitButtonProps: {
        type: 'submit';
        disabled: boolean;
        loading: boolean;
    };
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
    onSuccess?: () => void;
    autoFocus?: boolean;
    renderForm?: (props: RenderFormProps) => ReactNode;
    inputProps?: Partial<Pick<InputFieldProps<typeof Input>, 'label'>>;
    disableVerifyCta?: boolean;
    persistPasswordScope?: boolean;
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
}: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const [input, setInput] = useState(email.Value || '');
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const [verifyRecoveryEmailModal, setVerifyRecoveryEmailModalOpen, renderVerifyRecoveryEmailModal] = useModalState();
    const [confirmModal, setConfirmModal, renderConfirmModal] = useModalState();
    const [updatingEmail, withUpdatingEmail] = useLoading();

    const loading = renderVerifyRecoveryEmailModal || renderConfirmModal || updatingEmail;
    const confirmStep = !input && (hasReset || hasNotify);

    const handleUpdateEmail = async () => {
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(
            updateEmail({
                Email: input,
                PersistPasswordScope: persistPasswordScope,
            })
        );

        dispatch(userSettingsActions.set({ UserSettings }));

        // TODO: temporarily included until BE takes care of it
        if (UserSettings.HighSecurity.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED) {
            await api(updateResetEmail({ Reset: 0, PersistPasswordScope: persistPasswordScope }));
            await dispatch(userSettingsThunk({ cache: CacheType.None }));
        }

        createNotification({ text: c('Success').t`Email updated` });
        onSuccess?.();
    };

    return (
        <>
            {renderConfirmModal && (
                <ConfirmRemoveEmailModal
                    hasReset={hasReset}
                    hasNotify={hasNotify}
                    {...confirmModal}
                    onConfirm={() => withUpdatingEmail(handleUpdateEmail)}
                />
            )}
            {renderVerifyRecoveryEmailModal && <VerifyRecoveryEmailModal email={email} {...verifyRecoveryEmailModal} />}

            {renderForm({
                className,
                inputWidth,
                onSubmit: (e) => {
                    e.preventDefault();
                    if (!onFormSubmit()) {
                        return;
                    }
                    if (confirmStep) {
                        setConfirmModal(true);
                    } else {
                        void withUpdatingEmail(handleUpdateEmail);
                    }
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
                                    <Icon
                                        className="color-danger shrink-0 aligntop mr-1"
                                        name="exclamation-circle-filled"
                                    />
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
                                    <Icon
                                        className="color-success shrink-0 aligntop mr-1"
                                        name="checkmark-circle-filled"
                                    />
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
