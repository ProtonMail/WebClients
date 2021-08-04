import { useEffect, useState } from 'react';
import { c } from 'ttag';
import { reactivateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { generateMnemonicPayload, generateMnemonicWithSalt, MnemonicData } from '@proton/shared/lib/mnemonic';
import userPromptSvg from '@proton/styles/assets/img/mnemonic/user-prompt.svg';
import { Button, FormModal } from '../../components';
import { useApi, useGetUserKeys, useUser } from '../../hooks';
import { MnemonicPhraseStepButtons, MnemonicPhraseStepContent } from './MnemonicPhraseStep';

enum STEPS {
    INFO,
    MNEMONIC_PHRASE,
}

interface Props {
    onClose?: () => void;
}

const MnemonicPromptModal = (props: Props) => {
    const { onClose, ...rest } = props;
    const [step, setStep] = useState(STEPS.INFO);
    const api = useApi();
    const getUserKeys = useGetUserKeys();

    const [reactivatingMnemonic, setReactivatingMnemonic] = useState(false);

    const [{ Name }] = useUser();

    const [mnemonicData, setMnemonicData] = useState<MnemonicData>();

    useEffect(() => {
        const generateMnemonicData = async () => {
            const data = await generateMnemonicWithSalt();
            setMnemonicData(data);
        };

        void generateMnemonicData();
    }, []);

    const { section, ...modalProps } = (() => {
        if (step === STEPS.INFO) {
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
                } catch (error) {
                    setReactivatingMnemonic(false);
                }
            };

            return {
                section: (
                    <>
                        <div className="pb1 text-center mauto w66 on-mobile-w100">
                            <img src={userPromptSvg} alt="" />
                        </div>
                        <h1 className="mb0-5 text-2xl text-bold text-center">{c('Info')
                            .t`Create recovery passphrase`}</h1>
                        <p className="mt0 mb0">{c('Info')
                            .t`A recovery passphrase is one of the safest ways to protect access to your account. You can use it to access your account and recover your encrypted data if you ever forget your password.`}</p>
                    </>
                ),
                footer: (
                    <div className="w100">
                        <Button
                            onClick={handleSubmit}
                            fullWidth
                            loading={!mnemonicData || reactivatingMnemonic}
                            color="norm"
                        >
                            {c('Action').t`Create passphrase`}
                        </Button>
                        <Button className="mt1" onClick={onClose} fullWidth>
                            {c('Action').t`Don't secure account`}
                        </Button>
                    </div>
                ),
            };
        }

        if (!mnemonicData) {
            throw new Error('No mnemonic data');
        }

        if (step === STEPS.MNEMONIC_PHRASE) {
            const { mnemonic } = mnemonicData;

            return {
                title: c('Info').t`Your recovery passphrase`,
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

export default MnemonicPromptModal;
