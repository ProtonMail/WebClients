import { useEffect, useState } from 'react';
import { c } from 'ttag';
import { reactivateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { generateMnemonicPayload, generateMnemonicWithSalt, MnemonicData } from '@proton/shared/lib/mnemonic';
import userPromptSvg from '@proton/styles/assets/img/mnemonic/user-prompt.svg';
import {
    Button,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
} from '../../components';
import { useApi, useFeature, useGetUserKeys, useUser } from '../../hooks';
import { MnemonicPhraseStepButtons, MnemonicPhraseStepContent } from './MnemonicPhraseStep';
import { FeatureCode } from '../features';
import './MnemonicPromptModal.scss';

enum STEPS {
    INFO,
    MNEMONIC_PHRASE,
}

interface Props {
    open: ModalProps['open'];
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
}

const MnemonicPromptModal = ({ open, onClose, onExit }: Props) => {
    const [step, setStep] = useState(STEPS.INFO);
    const api = useApi();
    const getUserKeys = useGetUserKeys();

    const [reactivatingMnemonic, setReactivatingMnemonic] = useState(false);

    const [{ Name }] = useUser();

    const [mnemonicData, setMnemonicData] = useState<MnemonicData>();

    useEffect(() => {
        if (!open) {
            return;
        }

        const generateMnemonicData = async () => {
            const data = await generateMnemonicWithSalt();
            setMnemonicData(data);
        };

        void generateMnemonicData();
    }, [open]);

    const { feature: hasSeenMnemonicPrompt, update: setSeenMnemonicPrompt } = useFeature(
        FeatureCode.SeenMnemonicPrompt
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        if (hasSeenMnemonicPrompt?.Value === false) {
            void setSeenMnemonicPrompt(true);
        }
    }, [open, hasSeenMnemonicPrompt]);

    const handleSubmit = async () => {
        if (!mnemonicData) {
            return;
        }

        try {
            setReactivatingMnemonic(true);

            const userKeys = await getUserKeys();
            const { randomBytes, salt } = mnemonicData;
            const payload = await generateMnemonicPayload({ randomBytes, salt, userKeys, api, username: Name });

            await api(reactivateMnemonicPhrase(payload));

            setStep(STEPS.MNEMONIC_PHRASE);
        } catch (error: any) {
            setReactivatingMnemonic(false);
        }
    };

    if (step === STEPS.INFO) {
        return (
            <Modal as="form" size="small" open={open} onClose={onClose} onExit={onExit} onSubmit={handleSubmit}>
                <ModalHeader />
                <ModalContent>
                    <div className="pb1 text-center mauto w66 on-mobile-w100">
                        <img src={userPromptSvg} alt="" />
                    </div>
                    <h1 className="mb0-5 text-2xl text-bold text-center">{c('Info').t`Set a recovery phrase`}</h1>
                    <p className="mt0 mb0 text-center">{c('Info')
                        .t`A recovery phrase is one of the safest ways to protect access to your account. You can use it to access your account and recover your encrypted data if you ever forget your password.`}</p>
                </ModalContent>
                <ModalFooter className="mnemonic-prompt-footer">
                    <Button
                        fullWidth
                        onClick={handleSubmit}
                        loading={!mnemonicData || reactivatingMnemonic}
                        color="norm"
                    >
                        {c('Action').t`Generate recovery phrase`}
                    </Button>
                    <Button fullWidth onClick={onClose}>{c('Action').t`Skip`}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    if (!mnemonicData) {
        throw new Error('No mnemonic data');
    }

    if (step === STEPS.MNEMONIC_PHRASE) {
        const { mnemonic } = mnemonicData;

        return (
            <Modal size="small" open={open} onClose={onClose} onExit={onExit}>
                <ModalHeader title={c('Info').t`Your recovery phrase`} />
                <ModalContent>
                    <MnemonicPhraseStepContent mnemonic={mnemonic} />
                </ModalContent>
                <ModalFooter>
                    <MnemonicPhraseStepButtons mnemonic={mnemonic} onDone={onClose} />
                </ModalFooter>
            </Modal>
        );
    }

    throw new Error('Unknown step');
};

export default MnemonicPromptModal;
