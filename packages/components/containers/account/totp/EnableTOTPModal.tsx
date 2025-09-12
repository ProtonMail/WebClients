import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { userSettingsActions } from '@proton/account/userSettings';
import { Button, InlineLinkButton } from '@proton/atoms';
import Copy from '@proton/components/components/button/Copy';
import Form from '@proton/components/components/form/Form';
import QRCode from '@proton/components/components/image/QRCode';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TotpInput from '@proton/components/components/v2/input/TotpInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { TOTP_WRONG_ERROR, getSetupTotpSecret, setupTotp } from '@proton/shared/lib/api/settings';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { TWO_FA_RECOVERY_CODES_FILE_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { getTOTPData } from '@proton/shared/lib/settings/twoFactor';
import noop from '@proton/utils/noop';

interface ModalProperties {
    section: ReactNode;
    cancelButtonText?: string | null;
    onCancel?: () => void;
    submitButtonText?: string | null;
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

interface SetupTOTPResponse {
    TwoFactorRecoveryCodes: string[];
    UserSettings: UserSettings;
}

interface SetupTOTPSecretResponse {
    Secret: string;
}

const STEPS = {
    SCAN_CODE: 1,
    CONFIRM_CODE: 2,
    RECOVERY_CODES: 3,
};

const EnableTOTPModal = ({ onClose, ...rest }: ModalProps) => {
    const [user] = useUser();
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [state, setState] = useState<ReturnType<typeof getTOTPData> | null>(null);
    const [step, setStep] = useState(STEPS.SCAN_CODE);
    const [manualCode, setManualCode] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [totpError, setTotpError] = useState('');
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const handleClose = loading ? noop : onClose;
    const handleError = useErrorHandler();

    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        const run = async () => {
            const { Secret: secret } = await api<SetupTOTPSecretResponse>(getSetupTotpSecret());
            if (!secret) {
                throw new Error('Failed to get secret from server');
            }
            setState(getTOTPData(user.Email || user.Name, secret));
        };
        run().catch((e) => {
            handleError(e);
            onClose?.();
        });
    }, []);

    if (!authed) {
        return (
            <AuthModal
                scope="password"
                config={unlockPasswordChanges()}
                {...rest}
                onCancel={onClose}
                onSuccess={async () => {
                    setAuthed(true);
                }}
            />
        );
    }

    const {
        section,
        cancelButtonText,
        onCancel = handleClose,
        submitButtonText,
        onSubmit,
    } = ((): ModalProperties => {
        if (!state) {
            return {
                section: <Loader />,
            };
        }

        const { uri, sharedSecret, period, digits } = state;

        const handleSubmitScan = () => {
            setStep(STEPS.CONFIRM_CODE);
        };

        if (step === STEPS.SCAN_CODE && !manualCode) {
            // made button explicitly focusable to fix an issue for a blind user
            const switchButton = (
                <InlineLinkButton
                    tabIndex={0}
                    data-testid="totp:manual-button"
                    key="0"
                    onClick={() => setManualCode(true)}
                >
                    {c('Info').t`Enter key manually instead`}
                </InlineLinkButton>
            );

            return {
                section: (
                    <>
                        <div className="mb-4">
                            {c('Info')
                                .jt`Scan this code with your authenticator app to set up your account. ${switchButton}.`}
                        </div>
                        <div className="text-center">
                            <QRCode value={uri} size={200} />
                        </div>
                    </>
                ),
                onSubmit: handleSubmitScan,
            };
        }

        if (step === STEPS.SCAN_CODE && manualCode) {
            const switchButton = (
                <InlineLinkButton key="0" onClick={() => setManualCode(false)}>
                    {c('Info').t`Scan QR code instead`}
                </InlineLinkButton>
            );

            // added spaces to get a better vocalization for blind users
            const labelCode = sharedSecret.split('').join(' ');

            return {
                section: (
                    <>
                        <div className="mb-4">
                            {c('Info')
                                .jt`Manually enter this information into your authenticator app to set up your account. ${switchButton}.`}
                        </div>
                        <div>
                            <div className="flex flex-column sm:flex-row sm:items-center flex-nowrap max-w-full mb-2">
                                <div className="sm:w-1/5 my-auto" id="label-key-desc">{c('Label').t`Key`}</div>
                                <div className="sm:w-4/5 flex items-center text-bold">
                                    <code
                                        className="text-ellipsis flex-1 py-2"
                                        data-testid="totp:secret-key"
                                        aria-label={labelCode}
                                        aria-describedby="label-key-desc"
                                        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                                        tabIndex={0}
                                        title={sharedSecret}
                                    >
                                        {sharedSecret}
                                    </code>
                                    <Copy
                                        className="ml-2 shrink-0"
                                        tooltipText={c('Action').t`Copy key to the clipboard`}
                                        value={sharedSecret}
                                        onCopy={() =>
                                            createNotification({
                                                text: c('Notification').t`Key copied to the clipboard`,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex flex-column sm:flex-row sm:items-center flex-nowrap max-w-full  mb-4">
                                <div className="sm:w-1/5 my-auto">{c('Label').t`Interval`}</div>
                                <div className="sm:w-4/5 text-bold">
                                    <code>{period}</code>
                                </div>
                            </div>
                            <div className="flex flex-column sm:flex-row sm:items-center flex-nowrap max-w-full  mb-4">
                                <div className="sm:w-1/5 my-auto">{c('Label').t`Digits`}</div>
                                <div className="sm:w-4/5 text-bold">
                                    <code>{digits}</code>
                                </div>
                            </div>
                        </div>
                    </>
                ),
                onSubmit: handleSubmitScan,
            };
        }

        if (step === STEPS.CONFIRM_CODE) {
            const handleSubmit = async () => {
                try {
                    const result = await api<SetupTOTPResponse>(setupTotp(confirmationCode));
                    dispatch(userSettingsActions.update({ UserSettings: result.UserSettings }));
                    createNotification({ text: c('Info').t`Authenticator app 2FA enabled` });
                    setRecoveryCodes(result.TwoFactorRecoveryCodes);
                    setStep(STEPS.RECOVERY_CODES);
                } catch (error: any) {
                    const { code, message } = getApiError(error);
                    if (code === TOTP_WRONG_ERROR) {
                        setTotpError(message);
                    }
                }
            };

            return {
                section: (
                    <>
                        <div className="mb-4">{c('Info').t`Enter the code from your authenticator app`}</div>
                        <InputFieldTwo
                            as={TotpInput}
                            autoFocus
                            length={6}
                            autoComplete="one-time-code"
                            id="totp"
                            value={confirmationCode}
                            disableChange={loading}
                            onValue={(value: string) => {
                                setConfirmationCode(value);
                                setTotpError('');
                            }}
                            error={validator([requiredValidator(confirmationCode), totpError])}
                        />
                    </>
                ),
                cancelButtonText: c('Action').t`Back`,
                onCancel: () => {
                    setStep(STEPS.SCAN_CODE);
                },
                submitButtonText: c('Action').t`Submit`,
                onSubmit(event: FormEvent<HTMLFormElement>) {
                    if (!onFormSubmit(event.currentTarget)) {
                        return;
                    }
                    void withLoading(handleSubmit());
                },
            };
        }

        if (step === STEPS.RECOVERY_CODES) {
            return {
                section: (
                    <>
                        <div className="mb-4">
                            <span className="text-bold">{c('Info')
                                .t`Important: Please make sure you save the recovery codes. Otherwise you can permanently lose access to your account if you lose your two-factor authentication device.`}</span>
                            <br />
                            <br />
                            {c('Info')
                                .t`If you lose your two-factor-enabled device, these codes can be used instead of the 6-digit two-factor authentication code to sign in to your account. Each code can only be used once.`}
                        </div>
                        <div className="flex text-center">
                            {recoveryCodes.map((code) => {
                                return (
                                    <code
                                        data-testid="totp:recovery-code"
                                        key={code}
                                        className="w-custom p-2"
                                        style={{ '--w-custom': '49%' }}
                                    >
                                        {code}
                                    </code>
                                );
                            })}
                        </div>
                        <div className="text-center">
                            <Button
                                color="norm"
                                onClick={() => {
                                    const blob = new Blob([recoveryCodes.join('\r\n')], {
                                        type: 'text/plain;charset=utf-8',
                                    });
                                    downloadFile(blob, TWO_FA_RECOVERY_CODES_FILE_NAME);
                                    createNotification({
                                        text: c('Notification').t`Downloaded 2FA recovery codes`,
                                    });
                                }}
                            >
                                {c('Action').t`Download`}
                            </Button>
                        </div>
                    </>
                ),
                submitButtonText: null,
                onSubmit() {
                    onClose?.();
                },
                cancelButtonText: c('Action').t`Close`,
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <Modal as={Form} onSubmit={onSubmit} onClose={handleClose} size="medium" {...rest}>
            <ModalHeader title={c('Title').t`Set up authenticator app`} />
            <ModalContent>{section}</ModalContent>
            <ModalFooter>
                {cancelButtonText !== null ? (
                    <Button onClick={onCancel} disabled={loading}>
                        {cancelButtonText || c('Action').t`Cancel`}
                    </Button>
                ) : (
                    // Maintain submit button positioning
                    <div />
                )}
                {submitButtonText !== null && (
                    <Button loading={loading} type="submit" color="norm">
                        {submitButtonText || c('Action').t`Next`}
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    );
};

export default EnableTOTPModal;
