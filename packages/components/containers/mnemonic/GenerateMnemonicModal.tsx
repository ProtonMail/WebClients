import { useState, useEffect, FormEvent } from 'react';
import { c } from 'ttag';
import { reactivateMnemonicPhrase, updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { noop } from '@proton/shared/lib/helpers/function';
import { srpAuth } from '@proton/shared/lib/srp';
import { generateMnemonicPayload, generateMnemonicWithSalt, MnemonicData } from '@proton/shared/lib/mnemonic';

import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import {
    AlertModal,
    Button,
    Loader,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
} from '../../components';
import { useApi, useEventManager, useGetUserKeys, useLoading, useUser } from '../../hooks';
import { PasswordTotpInputs, useAskAuth } from '../password';
import { MnemonicPhraseStepButtons, MnemonicPhraseStepContent } from './MnemonicPhraseStep';

enum STEPS {
    CONFIRM,
    AUTH,
    MNEMONIC_PHRASE,
}

interface Props {
    confirmStep?: boolean;
    open: ModalProps['open'];
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
}

const GenerateMnemonicModal = ({ confirmStep = false, open, onClose, onExit }: Props) => {
    const [{ Name, MnemonicStatus }] = useUser();
    const callReactivateEndpoint =
        MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        MnemonicStatus === MNEMONIC_STATUS.OUTDATED ||
        MnemonicStatus === MNEMONIC_STATUS.PROMPT;

    const nonConfirmStep = callReactivateEndpoint ? STEPS.MNEMONIC_PHRASE : STEPS.AUTH;
    const [step, setStep] = useState(confirmStep ? STEPS.CONFIRM : nonConfirmStep);

    const api = useApi();
    const { call } = useEventManager();
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
            await call();

            if (confirmStep) {
                setStep(STEPS.MNEMONIC_PHRASE);
            }
        } catch (error: any) {
            onClose?.();
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

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
            await call();

            setStep(STEPS.MNEMONIC_PHRASE);
        } catch (error: any) {
            const { code, message } = getApiErrorMessage(error);
            setSubmittingAuth(false);
            if (code === PASSWORD_WRONG_ERROR) {
                setAuthError(message);
            } else {
                onClose?.();
            }
        }
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        const generateMnemonicData = async () => {
            const data = await generateMnemonicWithSalt();
            setMnemonicData(data);

            if (!confirmStep && callReactivateEndpoint) {
                await handleReactivate(data);
            }
        };

        void withGenerating(generateMnemonicData());
    }, [open]);

    if (step === STEPS.CONFIRM) {
        return (
            <AlertModal
                open={open}
                title={c('Title').t`Generate new recovery phrase?`}
                buttons={[
                    <Button
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
                    </Button>,
                    <Button disabled={reactivating} onClick={onClose}>
                        {c('Action').t`Cancel`}
                    </Button>,
                ]}
                onExit={onExit}
            >
                <p className="m0">{c('Info').t`Generating a new recovery phrase will deactivate your old one.`}</p>
            </AlertModal>
        );
    }

    if (step === STEPS.AUTH) {
        const handleClose = submittingAuth ? noop : onClose;

        const loading = !mnemonicData || submittingAuth || isLoadingAuth;

        return (
            <Modal as="form" size="small" open={open} onClose={handleClose} onExit={onExit} onSubmit={handleSubmit}>
                <ModalHeader title={c('Title').t`Sign in again to continue`} />
                <ModalContent>
                    {isLoadingAuth ? (
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
                    )}
                </ModalContent>
                <ModalFooter>
                    <Button onClick={handleClose} disabled={loading}>
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button loading={loading} type="submit" color="norm">
                        {c('Action').t`Submit`}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    if (step === STEPS.MNEMONIC_PHRASE) {
        const mnemonic = mnemonicData?.mnemonic;
        const handleClose = generating ? noop : onClose;

        return (
            <Modal size="small" open={open} onClose={handleClose} onExit={onExit}>
                <ModalHeader title={c('Info').t`Your recovery phrase`} />
                <ModalContent>
                    <MnemonicPhraseStepContent mnemonic={mnemonic} loading={generating} />
                </ModalContent>
                <ModalFooter>
                    <MnemonicPhraseStepButtons mnemonic={mnemonic} disabled={generating} onDone={onClose} />
                </ModalFooter>
            </Modal>
        );
    }

    throw new Error('Unknown step');
};

export default GenerateMnemonicModal;
