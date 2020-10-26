import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import QRCode from 'qrcode.react';
import { generateSharedSecret, getUri } from 'proton-shared/lib/helpers/twofa';
import { setupTotp, TOTP_WRONG_ERROR } from 'proton-shared/lib/api/settings';
import { srpAuth } from 'proton-shared/lib/srp';
import { PASSWORD_WRONG_ERROR } from 'proton-shared/lib/api/auth';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { TWO_FA_CONFIG, APPS } from 'proton-shared/lib/constants';

import { Alert, Href, InlineLinkButton, Loader, Block, FormModal, Button } from '../../components';
import { useConfig, useNotifications, useLoading, useAddresses, useUser, useApi, useEventManager } from '../../hooks';

import PasswordTotpInputs from '../password/PasswordTotpInputs';

const { PERIOD, DIGITS, ALGORITHM } = TWO_FA_CONFIG;

const STEPS = {
    INFO: 1,
    SCAN_CODE: 2,
    CONFIRM_CODE: 3,
    RECOVERY_CODES: 4,
};

const EnableTwoFactorModal = (props) => {
    const { APP_NAME } = useConfig();
    const [addresses] = useAddresses();
    const [user] = useUser();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [{ sharedSecret, uri = '' }, setTotpData] = useState({});
    const [step, setStep] = useState(STEPS.INFO);
    const [manualCode, setManualCode] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [totpError, setTotpError] = useState('');
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        if (!Array.isArray(addresses) || sharedSecret) {
            return;
        }

        const generatedSharedSecret = generateSharedSecret();
        const primaryAddress = addresses.find(({ Keys = [] }) => Keys.length > 0);
        const identifier = (primaryAddress && primaryAddress.Email) || user.Name;

        setTotpData({
            uri: getUri({
                identifier,
                issuer: 'Proton',
                sharedSecret: generatedSharedSecret,
                period: PERIOD,
                digits: DIGITS,
                algorithm: ALGORITHM,
            }),
            sharedSecret: generatedSharedSecret,
        });
    }, [addresses]);

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

            const guideButton = <Href key="0" url={twoFactorAuthLink}>{c('Info').t`reading our 2FA Guide first`}</Href>;

            return {
                section: (
                    <>
                        <Block>
                            {c('Info')
                                .t`This wizard will enable Two Factor Authentication (2FA) on your Proton account. 2FA will make your Proton account more secure so we recommend enabling it.`}
                        </Block>
                        <Alert>
                            {c('Info').jt`If you have never used 2FA before, we strongly recommend you ${guideButton}.`}
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
                        <div className="aligncenter">
                            <QRCode className="qr-code" value={uri} size={200} includeMargin={false} renderAs="svg" />
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
                            <div className="flex flex-spacebetween mb0-5">
                                <div className="w20">{c('Label').t`Key`}</div>
                                <div className="w80 flex-self-vcenter bold">
                                    <code>{sharedSecret}</code>
                                </div>
                            </div>
                            <div className="flex flex-spacebetween mb0-5">
                                <div className="w20">{c('Label').t`Interval`}</div>
                                <div className="w80 flex-self-vcenter bold">
                                    <code>{PERIOD}</code>
                                </div>
                            </div>
                            <div className="flex flex-spacebetween mb0-5">
                                <div className="w20">{c('Label').t`Digits`}</div>
                                <div className="w80 flex-self-vcenter bold">
                                    <code>{DIGITS}</code>
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
                    const { data: { Code, Error } = {} } = error;

                    setPasswordError();
                    setTotpError();

                    if (Code === PASSWORD_WRONG_ERROR) {
                        setPasswordError(Error);
                    }

                    if (Code === TOTP_WRONG_ERROR) {
                        setTotpError(Error);
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
                            <span className="bold">{c('Info')
                                .t`Important: Please make sure you save the recovery codes. Otherwise you can permanently lose access to your account if you lose your 2FA device.`}</span>
                            <br />
                            <br />
                            {c('Info')
                                .t`If you lose your two-factor-enabled device, these codes can be used instead of the 6-digit 2FA code to log into your account. Each code can only be used once.`}
                        </Alert>
                        <div className="flex aligncenter">
                            {recoveryCodes.map((code) => {
                                return (
                                    <code key={code} className="w49 p0-5">
                                        {code}
                                    </code>
                                );
                            })}
                        </div>
                        <div className="aligncenter">
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
                onClose: null,
                close: null,
            };
        }
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

EnableTwoFactorModal.propTypes = {
    onClose: PropTypes.func,
};

export default EnableTwoFactorModal;
