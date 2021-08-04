import { useState, useEffect } from 'react';
import { c } from 'ttag';
import { updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { noop } from '@proton/shared/lib/helpers/function';
import { srpAuth } from '@proton/shared/lib/srp';
import { generateMnemonicPayload, generateMnemonicWithSalt, MnemonicData } from '@proton/shared/lib/mnemonic';

import { Button, FormModal, Loader } from '../../components';
import { useApi, useGetUserKeys, useUser } from '../../hooks';
import { PasswordTotpInputs, useAskAuth } from '../password';
import { MnemonicPhraseStepButtons, MnemonicPhraseStepContent } from './MnemonicPhraseStep';

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

    const api = useApi();
    const [submittingAuth, setSubmittingAuth] = useState(false);
    const [authError, setAuthError] = useState('');
    const getUserKeys = useGetUserKeys();

    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [{ Name }] = useUser();
    const [hasTOTPEnabled, isLoadingAuth] = useAskAuth();

    const [mnemonicData, setMnemonicData] = useState<MnemonicData>();

    useEffect(() => {
        const generateMnemonicData = async () => {
            const data = await generateMnemonicWithSalt();
            setMnemonicData(data);
        };

        void generateMnemonicData();
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

                    const userKeys = await getUserKeys();
                    const { randomBytes, salt } = mnemonicData;
                    const payload = await generateMnemonicPayload({ randomBytes, salt, userKeys, api, username: Name });

                    await srpAuth({
                        api,
                        credentials: { password, totp },
                        config: updateMnemonicPhrase(payload),
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
            const { mnemonic } = mnemonicData;

            return {
                title: c('Info').t`Your recovery phrase`,
                section: <MnemonicPhraseStepContent mnemonic={mnemonic} />,
                footer: <MnemonicPhraseStepButtons mnemonic={mnemonic} />,
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
