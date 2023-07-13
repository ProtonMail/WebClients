import { FormEvent, ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { TOTP_WRONG_ERROR, setupTotp } from '@proton/shared/lib/api/settings';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { getTOTPData } from '@proton/shared/lib/settings/twoFactor';
import noop from '@proton/utils/noop';

import {
    Form,
    InlineLinkButton,
    InputFieldTwo,
    Loader,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    QRCode,
    TotpInput,
    useFormErrors,
} from '../../../components';
import { useApi, useConfig, useEventManager, useNotifications, useUser } from '../../../hooks';
import AuthModal from '../../password/AuthModal';

interface ModalProperties {
    section: ReactNode;
    cancelButtonText?: string | null;
    onCancel?: () => void;
    submitButtonText?: string | null;
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

interface SetupTOTPResponse {
    TwoFactorRecoveryCodes: string[];
}

const STEPS = {
    INFO: 1,
    SCAN_CODE: 2,
    CONFIRM_CODE: 3,
    RECOVERY_CODES: 4,
};

const EnableTOTPModal = ({ onClose, ...rest }: ModalProps) => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [{ sharedSecret, uri = '', period, digits }] = useState(() => {
        return getTOTPData(user.Email || user.Name);
    });
    const [step, setStep] = useState(STEPS.INFO);
    const [manualCode, setManualCode] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [totpError, setTotpError] = useState('');
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const handleClose = loading ? noop : onClose;

    const [authed, setAuthed] = useState(false);

    if (!authed) {
        return (
            <AuthModal
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
        if (!sharedSecret) {
            return {
                section: <Loader />,
            };
        }

        if (step === STEPS.INFO) {
            const twoFactorAuthLink =
                APP_NAME === APPS.PROTONVPN_SETTINGS
                    ? 'https://protonvpn.com/support/two-factor-authentication'
                    : getKnowledgeBaseUrl('/two-factor-authentication-2fa');

            // translator: complete sentence is: If you have never used two-factor authentication before, we strongly recommend you <link>read our two-factor authentication guide first</link>.
            const guideButton = (
                <Href key="0" href={twoFactorAuthLink}>{c('Info')
                    .t`read our two-factor authentication guide first`}</Href>
            );

            const BRAND_NAME_TWO = BRAND_NAME;

            return {
                section: (
                    <>
                        <div className="mb-4">
                            {c('Info')
                                .t`This wizard will enable Two-Factor Authentication (2FA) on your ${BRAND_NAME} account. Two-factor authentication will make your ${BRAND_NAME_TWO} account more secure so we recommend enabling it.`}
                        </div>
                        <div className="mb-4">
                            {
                                // translator: complete sentence is: If you have never used two-factor authentication before, we strongly recommend you <link>read our two-factor authentication guide first</link>.
                                c('Info')
                                    .jt`If you have never used two-factor authentication before, we strongly recommend you ${guideButton}.`
                            }
                        </div>
                    </>
                ),
                onSubmit() {
                    setStep(STEPS.SCAN_CODE);
                },
            };
        }

        const handleSubmitScan = () => {
            setStep(STEPS.CONFIRM_CODE);
        };

        if (step === STEPS.SCAN_CODE && !manualCode) {
            const switchButton = (
                <InlineLinkButton data-testid="totp:manual-button" key="0" onClick={() => setManualCode(true)}>
                    {c('Info').t`Enter key manually instead`}
                </InlineLinkButton>
            );

            return {
                section: (
                    <>
                        <div className="mb-4">
                            {c('Info')
                                .jt`Scan this code with your two-factor authentication device to set up your account. ${switchButton}.`}
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

            return {
                section: (
                    <>
                        <div className="mb-4">
                            {c('Info')
                                .jt`Manually enter this information into your two-factor authentication device to set up your account. ${switchButton}.`}
                        </div>
                        <div>
                            <div className="flex flex-justify-space-between mb-2">
                                <div className="w20">{c('Label').t`Key`}</div>
                                <div className="w80 flex-align-self-center text-bold">
                                    <code data-testid="totp:secret-key">{sharedSecret}</code>
                                </div>
                            </div>
                            <div className="flex flex-justify-space-between mb-2">
                                <div className="w20">{c('Label').t`Interval`}</div>
                                <div className="w80 flex-align-self-center text-bold">
                                    <code>{period}</code>
                                </div>
                            </div>
                            <div className="flex flex-justify-space-between mb-2">
                                <div className="w20">{c('Label').t`Digits`}</div>
                                <div className="w80 flex-align-self-center text-bold">
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
                    const result = await api<SetupTOTPResponse>(setupTotp(sharedSecret, confirmationCode));
                    await call();
                    createNotification({ text: c('Info').t`Two-factor authentication enabled` });
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
                                    <code data-testid="totp:recovery-code" key={code} className="w49 p-2">
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
                                    const filename = 'proton_recovery_codes.txt';
                                    downloadFile(blob, filename);
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
            <ModalHeader title={c('Title').t`Set up two-factor authentication`} />
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
