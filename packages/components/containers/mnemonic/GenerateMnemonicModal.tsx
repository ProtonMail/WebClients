import { useState, MouseEvent, useEffect } from 'react';
import { c } from 'ttag';
import { generateMnemonicFromBase64RandomBytes, generateMnemonicBase64RandomBytes } from '@proton/shared/lib/mnemonic';
import { updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { encryptPrivateKey } from 'pmcrypto';
import { computeKeyPassword, generateKeySalt } from '@proton/srp';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { noop } from '@proton/shared/lib/helpers/function';
import { srpAuth, srpGetVerify } from '@proton/shared/lib/srp';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import { Button, FormModal, InputFieldTwo, Loader, TextAreaTwo } from '../../components';
import { useApi, useGetUserKeys, useNotifications, useUser } from '../../hooks';
import { PasswordTotpInputs, useAskAuth } from '../password';

enum STEPS {
    CONFIRM,
    AUTH,
    MNEMONIC_PHRASE,
}

interface Props {
    confirmStep?: boolean;
    onClose?: () => void;
    onSuccess: (data?: any) => void;
}

const GenerateMnemonicModal = (props: Props) => {
    const { confirmStep = false, onClose, onSuccess, ...rest } = props;
    const [step, setStep] = useState(confirmStep ? STEPS.CONFIRM : STEPS.AUTH);

    const { createNotification } = useNotifications();

    const api = useApi();
    const [submittingAuth, setSubmittingAuth] = useState(false);
    const [authError, setAuthError] = useState('');
    const getUserKeys = useGetUserKeys();

    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [{ Name }] = useUser();
    const [hasTOTPEnabled, isLoadingAuth] = useAskAuth();

    const [mnemonicData, setMnemonicData] = useState<{
        randomBytes: string;
        salt: string;
        mnemonicWords: string;
    }>();

    useEffect(() => {
        const generateMnemonicData = async () => {
            const randomBytes = generateMnemonicBase64RandomBytes();
            const salt = generateKeySalt();
            const mnemonicWords = await generateMnemonicFromBase64RandomBytes(randomBytes);
            setMnemonicData({
                randomBytes,
                salt,
                mnemonicWords,
            });
        };

        generateMnemonicData();
    }, []);

    const { section, ...modalProps } = (() => {
        if (step === STEPS.CONFIRM) {
            return {
                title: c('Action').t`Create new recovery phrase?`,
                tiny: true,
                hasClose: false,
                section: (
                    <>
                        <p className="mt0">{c('Info')
                            .t`Creating a new recovery phrase will deactivate your old one.`}</p>
                        <p className="mb0">{c('Info').t`Are you sure you want to continue?`}</p>
                    </>
                ),
                footer: (
                    <div className="w100">
                        <Button fullWidth color="norm" loading={!mnemonicData} onClick={() => setStep(STEPS.AUTH)}>
                            {c('Action').t`Create new recovery phrase`}
                        </Button>
                        <Button className="mt1" fullWidth onClick={onClose}>
                            {c('Action').t`Cancel`}
                        </Button>
                    </div>
                ),
            };
        }

        if (step === STEPS.AUTH) {
            const handleSubmit = async () => {
                if (!mnemonicData) {
                    return;
                }

                try {
                    setSubmittingAuth(true);

                    const [hashedPassphrase, userKeys] = await Promise.all([
                        computeKeyPassword(mnemonicData.randomBytes, mnemonicData.salt),
                        getUserKeys(),
                    ]);
                    const reEncryptedKeys = await Promise.all(
                        userKeys.map(async ({ ID, privateKey }) => {
                            const PrivateKey = await encryptPrivateKey(privateKey, hashedPassphrase);
                            return {
                                ID,
                                PrivateKey,
                            };
                        })
                    );

                    const { Auth } = await srpGetVerify({
                        api,
                        credentials: {
                            username: Name,
                            password: mnemonicData.randomBytes,
                        },
                    });

                    await srpAuth({
                        api,
                        credentials: { password, totp },
                        config: updateMnemonicPhrase({
                            MnemonicUserKeys: reEncryptedKeys,
                            MnemonicSalt: mnemonicData.salt,
                            MnemonicAuth: Auth,
                        }),
                    });

                    onSuccess();
                    setStep(STEPS.MNEMONIC_PHRASE);
                } catch (error) {
                    const { code, message } = getApiErrorMessage(error);
                    setSubmittingAuth(false);
                    if (code === PASSWORD_WRONG_ERROR) {
                        setAuthError(message);
                    } else {
                        onClose?.();
                    }
                }
            };

            return {
                title: c('Action').t`Enter password to continue`,
                cancel: c('Action').t`Cancel`,
                submit: c('Action').t`Continue`,
                hasClose: !submittingAuth,
                onClose: submittingAuth ? noop : onClose,
                error: authError,
                loading: !mnemonicData || submittingAuth || isLoadingAuth,
                onSubmit: handleSubmit,
                section: isLoadingAuth ? (
                    <Loader />
                ) : (
                    <PasswordTotpInputs
                        password={password}
                        setPassword={setPassword}
                        passwordError={authError}
                        totp={totp}
                        setTotp={setTotp}
                        totpError={authError}
                        showTotp={hasTOTPEnabled}
                    />
                ),
            };
        }

        if (!mnemonicData) {
            throw new Error('No mnemonic data');
        }

        if (step === STEPS.MNEMONIC_PHRASE) {
            const { mnemonicWords } = mnemonicData;
            const handleDownload = async () => {
                const blob = new Blob([mnemonicWords], { type: 'data:text/plain;charset=utf-8;' });
                downloadFile(blob, `recovery_phrase-${Name}.txt`);
            };

            const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                textToClipboard(mnemonicWords, event.currentTarget);
                createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
            };

            return {
                title: c('Info').t`Your recovery phrase`,
                section: (
                    <>
                        <p className="mt0">
                            {c('Info').t`Your recovery phrase is a series of 12 words in a specific order.`}
                        </p>
                        <p>
                            {c('Info')
                                .t`Please write your recovery phrase down in the order it appears and keep it somewhere safe. Your recovery phrase can be used to fully recover access to your account and your encrypted messages.`}
                        </p>

                        <InputFieldTwo
                            id="mnemonic"
                            bigger
                            as={TextAreaTwo}
                            rows={3}
                            readOnly
                            label={c('Label').t`Recovery phrase`}
                            placeholder={c('Label').t`Your recovery phrase`}
                            value={mnemonicWords}
                            autoFocus
                        />
                    </>
                ),
                footer: (
                    <div className="w100">
                        <Button onClick={handleDownload} fullWidth color="norm">
                            {c('Action').t`Download`}
                        </Button>
                        <Button className="mt1" onClick={handleCopy} fullWidth>
                            {c('Action').t`Copy to clipboard`}
                        </Button>
                    </div>
                ),
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <FormModal small noTitleEllipsis onClose={onClose} {...rest} {...modalProps}>
            {section}
        </FormModal>
    );
};

export default GenerateMnemonicModal;
