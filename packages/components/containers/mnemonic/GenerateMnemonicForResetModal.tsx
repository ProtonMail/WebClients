import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { reactivateMnemonicPhrase, updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { encodeAutomaticResetParams } from '@proton/shared/lib/helpers/encoding';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { MnemonicData, generateMnemonicPayload, generateMnemonicWithSalt } from '@proton/shared/lib/mnemonic';
import noop from '@proton/utils/noop';

import {
    Href,
    Icon,
    InlineLinkButton,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    useModalState,
} from '../../components';
import { useApi, useEventManager, useGetUserKeys, useLoading, useNotifications, useUser } from '../../hooks';
import AuthModal from '../password/AuthModal';
import { MnemonicPhraseStepContent } from './MnemonicPhraseStep';

enum STEPS {
    AUTH,
    MNEMONIC_PHRASE,
}

interface Props {
    open: ModalProps['open'];
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
}

const GenerateMnemonicForResetModal = ({ open, onClose, onExit }: Props) => {
    const [{ Name, MnemonicStatus }] = useUser();
    const { createNotification } = useNotifications();
    const callReactivateEndpoint =
        MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        MnemonicStatus === MNEMONIC_STATUS.OUTDATED ||
        MnemonicStatus === MNEMONIC_STATUS.PROMPT;
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();

    const nonConfirmStep = callReactivateEndpoint ? STEPS.MNEMONIC_PHRASE : STEPS.AUTH;
    const [step, setStep] = useState(nonConfirmStep);

    const api = useApi();
    const { call } = useEventManager();
    const getUserKeys = useGetUserKeys();

    const [generating, withGenerating] = useLoading();

    const [mnemonicData, setMnemonicData] = useState<MnemonicData>();

    const getPayload = async (data: MnemonicData) => {
        const userKeys = await getUserKeys();
        const { randomBytes, salt } = data;

        return generateMnemonicPayload({ randomBytes, salt, userKeys, api, username: Name });
    };

    const handleReactivate = async (data: MnemonicData) => {
        try {
            const payload = await getPayload(data);
            await api(reactivateMnemonicPhrase(payload));
            await call();
        } catch (error: any) {
            onClose?.();
        }
    };

    const handleDownload = async () => {
        if (!mnemonicData?.mnemonic) {
            return;
        }

        const blob = new Blob([mnemonicData.mnemonic], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, `proton_recovery_phrase.txt`);
        createNotification({ text: c('Info').t`Recovery phrase downloaded` });
    };

    useEffect(() => {
        const generateMnemonicData = async () => {
            const data = await generateMnemonicWithSalt();
            setMnemonicData(data);

            if (step === STEPS.AUTH) {
                setAuthModalOpen(true);
                return;
            }

            if (callReactivateEndpoint) {
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
            {(step === STEPS.MNEMONIC_PHRASE || authenticating) && (
                <Modal size="small" open={open} onClose={handleClose} onExit={onExit}>
                    <ModalHeader title={c('Info').t`Download recovery phrase`} />
                    <ModalContent>
                        <MnemonicPhraseStepContent
                            mnemonic={mnemonicData?.mnemonic}
                            loading={generating || authenticating}
                        >
                            <p className="mt0">
                                {c('Info').t`Before you reset your password, download your recovery phrase.`}
                            </p>

                            <p>
                                {c('Info')
                                    .t`If you ever need to reset your password again, you’ll need to enter this phrase to get back into your account and unlock your data.`}
                            </p>

                            <p className="color-warning">
                                <Icon className="mr0-5 float-left mt0-25" name="exclamation-circle-filled" />

                                {c('Info').t`Make sure you keep your recovery phrase somewhere private.`}
                            </p>
                        </MnemonicPhraseStepContent>
                        <InlineLinkButton
                            onClick={handleDownload}
                            disabled={!mnemonicData?.mnemonic || generating || authenticating}
                            className="mt1"
                        >
                            {c('Action').t`Download`}
                        </InlineLinkButton>
                    </ModalContent>
                    <ModalFooter className="flex-justify-end">
                        <ButtonLike
                            color="norm"
                            as={Href}
                            href={`https://account.proton.me/reset-password#${encodeAutomaticResetParams({
                                username: Name,
                                value: mnemonicData?.mnemonic,
                            })}`}
                            disabled={!mnemonicData?.mnemonic || generating || authenticating}
                        >
                            {c('Info').t`Reset password`}
                        </ButtonLike>
                        ,
                    </ModalFooter>
                </Modal>
            )}
        </>
    );
};

export default GenerateMnemonicForResetModal;
