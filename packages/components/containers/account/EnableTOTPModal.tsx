import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { setupTotp, TOTP_WRONG_ERROR } from '@proton/shared/lib/api/settings';
import { srpAuth } from '@proton/shared/lib/srp';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { APPS } from '@proton/shared/lib/constants';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getTOTPData } from '@proton/shared/lib/settings/twoFactor';

import { QRCode, Alert, Href, InlineLinkButton, Loader, Block, FormModal, Button } from '../../components';
import {
    useConfig,
    useNotifications,
    useLoading,
    useApi,
    useEventManager,
    useGetAddresses,
    useGetUser,
} from '../../hooks';

import PasswordTotpInputs from '../password/PasswordTotpInputs';

const STEPS = {
    INFO: 1,
    SCAN_CODE: 2,
    CONFIRM_CODE: 3,
    RECOVERY_CODES: 4,
};

const INITIAL_STATE = {
    sharedSecret: '',
    uri: '',
    period: 0,
    digits: 0,
};

const EnableTOTPModal = (props: any) => {
    const { APP_NAME } = useConfig();
    const getAddresses = useGetAddresses();
    const getUser = useGetUser();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [{ sharedSecret, uri = '', period, digits }, setTotpData] = useState(INITIAL_STATE);
    const [step, setStep] = useState(STEPS.INFO);
    const [manualCode, setManualCode] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [totpError, setTotpError] = useState('');
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        const run = async () => {
            const [user, addresses] = await Promise.all([getUser(), getAddresses()]);
            const primaryAddress = addresses.find(({ Keys = [] }) => Keys.length > 0);
            const identifier = primaryAddress?.Email || user.Name;
            setTotpData(getTOTPData(identifier));
        };
        run();
    }, []);

    const { section, ...modalProps } = (() => {
        if (!sharedSecret) {
            return {
                section: <Loader />,
            };
        }

        if (step === STEPS.INFO) {
            const twoFactorAuthLink =
                APP_NAME === APPS.PROTONVPN_SETTINGS
                    ? 'https://protonvpn.com/support/two-factor-authentication'
                    : 'https://protonmail.com/support/knowledge-base/two-factor-authentication';

            const guideButton = (
                <Href key="0" url={twoFactorAuthLink}>{c('Info')
                    .t`reading our two-factor authentication Guide first`}</Href>
            );

            return {
                section: (
                    <>
                        <Block>
                            {c('Info')
                                .t`This wizard will enable Two-Factor Authentication (2FA) on your Proton account. Two-factor authentication will make your Proton account more secure so we recommend enabling it.`}
                        </Block>
                        <Alert>
                            {c('Info')
                                .jt`If you have never used two-factor authentication before, we strongly recommend you ${guideButton}.`}
                        </Alert>
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
                <InlineLinkButton key="0" onClick={() => setManualCode(true)}>
                    {c('Info').t`Enter key manually instead`}
                </InlineLinkButton>
            );

            return {
                section: (
                    <>
                        <Alert>
                            {c('Info')
                                .jt`Scan this code with your two-factor authentication device to set up your account. ${switchButton}.`}
                        </Alert>
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
                        <Alert>
                            {c('Info')
                                .jt`Manually enter this information into your two-factor authentication device to set up your account. ${switchButton}.`}
                        </Alert>
                        <div>
                            <div className="flex flex-justify-space-between mb0-5">
                                <div className="w20">{c('Label').t`Key`}</div>
                                <div className="w80 flex-align-self-center text-bold">
                                    <code>{sharedSecret}</code>
                                </div>
                            </div>
                            <div className="flex flex-justify-space-between mb0-5">
                                <div className="w20">{c('Label').t`Interval`}</div>
                                <div className="w80 flex-align-self-center text-bold">
                                    <code>{period}</code>
                                </div>
                            </div>
                            <div className="flex flex-justify-space-between mb0-5">
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
                    const { TwoFactorRecoveryCodes } = await srpAuth({
                        api,
                        credentials: { password },
                        config: setupTotp(sharedSecret, totp),
                    });
                    await call();
                    createNotification({ text: c('Info').t`Two-factor authentication enabled` });
                    setRecoveryCodes(TwoFactorRecoveryCodes);
                    setStep(STEPS.RECOVERY_CODES);
                } catch (error) {
                    const { code, message } = getApiError(error);

                    setPasswordError('');
                    setTotpError('');

                    if (code === PASSWORD_WRONG_ERROR) {
                        setPasswordError(message);
                    }

                    if (code === TOTP_WRONG_ERROR) {
                        setTotpError(message);
                    }
                }
            };

            return {
                section: (
                    <PasswordTotpInputs
                        password={password}
                        setPassword={setPassword}
                        passwordError={passwordError}
                        totp={totp}
                        setTotp={setTotp}
                        totpError={totpError}
                        showTotp
                    />
                ),
                close: <Button type="button" onClick={() => setStep(STEPS.SCAN_CODE)}>{c('Action').t`Back`}</Button>,
                onSubmit() {
                    withLoading(handleSubmit());
                },
                submit: c('Action').t`Submit`,
            };
        }

        if (step === STEPS.RECOVERY_CODES) {
            return {
                section: (
                    <>
                        <Alert>
                            <span className="text-bold">{c('Info')
                                .t`Important: Please make sure you save the recovery codes. Otherwise you can permanently lose access to your account if you lose your two-factor authentication device.`}</span>
                            <br />
                            <br />
                            {c('Info')
                                .t`If you lose your two-factor-enabled device, these codes can be used instead of the 6-digit two-factor authentication code to log into your account. Each code can only be used once.`}
                        </Alert>
                        <div className="flex text-center">
                            {recoveryCodes.map((code) => {
                                return (
                                    <code key={code} className="w49 p0-5">
                                        {code}
                                    </code>
                                );
                            })}
                        </div>
                        <div className="text-center">
                            <Button
                                onClick={() => {
                                    const blob = new Blob([recoveryCodes.join('\r\n')], {
                                        type: 'text/plain;charset=utf-8;',
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
                onSubmit() {
                    props.onClose();
                },
                submit: c('Action').t`Ok`,
                close: null,
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <FormModal
            title={c('Title').t`Set up two-factor authentication`}
            submit={c('Action').t`Next`}
            loading={loading}
            {...props}
            {...modalProps}
        >
            {section}
        </FormModal>
    );
};

export default EnableTOTPModal;
