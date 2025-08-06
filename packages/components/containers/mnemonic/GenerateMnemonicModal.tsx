import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useLoading } from '@proton/hooks';
import { reactivateMnemonicPhrase, updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import type { GeneratedMnemonicData } from '@proton/shared/lib/mnemonic';
import { generateMnemonicPayload, generateMnemonicWithSalt } from '@proton/shared/lib/mnemonic';
import noop from '@proton/utils/noop';

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
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();

    const nonConfirmStep = callReactivateEndpoint ? STEPS.MNEMONIC_PHRASE : STEPS.AUTH;
    const [step, setStep] = useState(confirmStep ? STEPS.CONFIRM : nonConfirmStep);

    const api = useApi();
    const { call } = useEventManager();
    const getUserKeys = useGetUserKeys();

    const [generating, withGenerating] = useLoading();
    const [reactivating, withReactivating] = useLoading();

    const [mnemonicData, setMnemonicData] = useState<GeneratedMnemonicData>();

    const getPayload = async (data: GeneratedMnemonicData) => {
        const userKeys = await getUserKeys();
        const { randomBytes, salt } = data;

        return generateMnemonicPayload({ randomBytes, salt, userKeys, api, username: Name });
    };

    const handleReactivate = async (data: GeneratedMnemonicData) => {
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

    useEffect(() => {
        const generateMnemonicData = async () => {
            const data = await generateMnemonicWithSalt();
            setMnemonicData(data);

            if (step === STEPS.AUTH) {
                setAuthModalOpen(true);
                return;
            }

            if (!confirmStep && callReactivateEndpoint) {
                await handleReactivate(data);
            }
        };
        void withGenerating(generateMnemonicData());
    }, []);

    const authenticating = step === STEPS.AUTH;
    const handleClose = generating ? noop : onClose;

    return (
        <>
            {renderAuthModal && mnemonicData && (
                <AuthModal
                    scope="password"
                    config={unlockPasswordChanges()}
                    {...authModalProps}
                    onCancel={onClose}
                    onSuccess={async () => {
                        try {
                            const payload = await getPayload(mnemonicData);
                            await api(updateMnemonicPhrase(payload));
                            await call();
                            await api(lockSensitiveSettings());
                            setStep(STEPS.MNEMONIC_PHRASE);
                        } catch (e) {
                            onClose?.();
                        }
                    }}
                />
            )}
            {step === STEPS.CONFIRM && (
                <Prompt
                    open={open}
                    title={c('Title').t`Generate new recovery phrase?`}
                    buttons={[
                        <Button
                            color="norm"
                            disabled={!mnemonicData}
                            loading={reactivating}
                            onClick={() => {
                                if (!mnemonicData) {
                                    return;
                                }
                                if (callReactivateEndpoint) {
                                    void withReactivating(handleReactivate(mnemonicData));
                                } else {
                                    setAuthModalOpen(true);
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
                    <p className="m-0">{c('Info').t`Generating a new recovery phrase will deactivate your old one.`}</p>
                </Prompt>
            )}
            {(step === STEPS.MNEMONIC_PHRASE || authenticating) && (
                <Modal size="small" open={open} onClose={handleClose} onExit={onExit}>
                    <ModalHeader title={c('Info').t`Your recovery phrase`} />
                    <ModalContent>
                        <MnemonicPhraseStepContent
                            mnemonic={mnemonicData?.mnemonic}
                            loading={generating || authenticating}
                        />
                    </ModalContent>
                    <ModalFooter>
                        <MnemonicPhraseStepButtons
                            mnemonic={mnemonicData?.mnemonic}
                            disabled={generating || authenticating}
                            onDone={onClose}
                        />
                    </ModalFooter>
                </Modal>
            )}
        </>
    );
};

export default GenerateMnemonicModal;
