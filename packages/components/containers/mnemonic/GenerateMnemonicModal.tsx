import { useState, useEffect } from 'react';
import { c } from 'ttag';
import { reactivateMnemonicPhrase, updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { noop } from '@proton/shared/lib/helpers/function';
import { srpAuth } from '@proton/shared/lib/srp';
import { generateMnemonicPayload, generateMnemonicWithSalt, MnemonicData } from '@proton/shared/lib/mnemonic';

import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { Button, FormModal, Loader } from '../../components';
import { useApi, useGetUserKeys, useLoading, useUser } from '../../hooks';
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
    onSuccess: () => void;
}

const GenerateMnemonicModal = ({ confirmStep = false, onClose = () => {}, onSuccess, ...rest }: Props) => {
    const [{ Name, MnemonicStatus }] = useUser();
    const callReactivateEndpoint =
        MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        MnemonicStatus === MNEMONIC_STATUS.OUTDATED ||
        MnemonicStatus === MNEMONIC_STATUS.PROMPT;

    const nonConfirmStep = callReactivateEndpoint ? STEPS.MNEMONIC_PHRASE : STEPS.AUTH;
    const [step, setStep] = useState(confirmStep ? STEPS.CONFIRM : nonConfirmStep);

    const api = useApi();
    const [submittingAuth, setSubmittingAuth] = useState(false);
    const [authError, setAuthError] = useState('');
    const getUserKeys = useGetUserKeys();

    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [hasTOTPEnabled, isLoadingAuth] = useAskAuth();

    const [generating, withGenerating] = useLoading();
    const [reactivating, withReactivating] = useLoading();

    const [mnemonicData, setMnemonicData] = useState<MnemonicData>();

    const getPayload = async (data: MnemonicData) => {
        const userKeys = await getUserKeys();
        const { randomBytes, salt } = data;

        return generateMnemonicPayload({ randomBytes, salt, userKeys, api, username: Name });
    };

    const handleReactivate = async (data: MnemonicData | undefined) => {
        if (!data) {
            return;
        }

        try {
            const payload = await getPayload(data);
            await api(reactivateMnemonicPhrase(payload));

            onSuccess();
            if (confirmStep) {
                setStep(STEPS.MNEMONIC_PHRASE);
            }
        } catch (error: any) {
            onClose?.();
        }
    };

    useEffect(() => {
        const generateMnemonicData = async () => {
            const data = await generateMnemonicWithSalt();
            setMnemonicData(data);

            if (!confirmStep && callReactivateEndpoint) {
                await handleReactivate(data);
            }
        };

        void withGenerating(generateMnemonicData());
    }, []);

    const { section, ...modalProps } = (() => {
        if (step === STEPS.CONFIRM) {
            return {
                title: c('Action').t`Generate new recovery phrase?`,
                tiny: true,
                hasClose: false,
                section: (
                    <p className="m0">{c('Info').t`Generating a new recovery phrase will deactivate your old one.`}</p>
                ),
                footer: (
                    <div className="w100">
                        <Button
                            fullWidth
                            color="norm"
                            disabled={!mnemonicData}
                            loading={reactivating}
                            onClick={() => {
                                if (callReactivateEndpoint) {
                                    void withReactivating(handleReactivate(mnemonicData));
                                } else {
                                    setStep(STEPS.AUTH);
                                }
                            }}
                        >
                            {c('Action').t`Generate recovery phrase`}
                        </Button>
                        <Button className="mt1" fullWidth disabled={reactivating} onClick={onClose}>
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
                    const payload = await getPayload(mnemonicData);

                    await srpAuth({
                        api,
                        credentials: { password, totp },
                        config: updateMnemonicPhrase(payload),
                    });

                    onSuccess();
                    setStep(STEPS.MNEMONIC_PHRASE);
                } catch (error: any) {
                    const { code, message } = getApiErrorMessage(error);
                    setSubmittingAuth(false);
                    if (code === PASSWORD_WRONG_ERROR) {
                        setAuthError(message);
                    } else {
                        onClose();
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

        if (step === STEPS.MNEMONIC_PHRASE) {
            const mnemonic = mnemonicData?.mnemonic;

            return {
                hasClose: !generating,
                title: c('Info').t`Your recovery phrase`,
                section: <MnemonicPhraseStepContent mnemonic={mnemonic} loading={generating} />,
                footer: <MnemonicPhraseStepButtons mnemonic={mnemonic} disabled={generating} onDone={onClose} />,
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
