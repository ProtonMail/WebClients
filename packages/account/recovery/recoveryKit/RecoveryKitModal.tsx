import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import Prompt from '@proton/components/components/prompt/Prompt';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';

import { selectMnemonicData } from '../mnemonic';
import type { RecoveryKitActionProps } from './RecoveryKitAction';
import { RecoveryKitContent, type RecoveryKitContentProps } from './RecoveryKitContent';
import type { DeferredMnemonicData } from './generateDeferredMnemonicData';
import { generateRecoveryKitData, setRecoveryPhrase } from './recoveryPhraseActions';

interface Props extends Omit<ModalProps<'div'>, 'children' | 'buttons'> {
    onSuccess?: () => void;
}

const DownloadRecoveryKitModal = ({ onSuccess, ...rest }: Props) => {
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const [recoveryKitData, setRecoveryKitData] = useState<DeferredMnemonicData | null>(null);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    useEffect(() => {
        void (async function initialize() {
            try {
                const data = await dispatch(generateRecoveryKitData());
                setRecoveryKitData(data);
            } catch (e) {
                handleError(e);
                // Close as there's nothing meaningful to do at this point
                rest.onClose?.();
            }
        })();
    }, []);

    const handleSave: RecoveryKitActionProps['onSaveRecoveryKit'] = (type, recoveryKitData) => {
        recoveryKitData.save.handle(type);
        if (type === 'copy') {
            createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
        }
    };

    const handleSaveRecoveryKit: RecoveryKitContentProps['onSaveRecoveryKit'] = (type, recoveryKitData) => {
        // If we've already sent the payload for this data we'll just save the kit.
        if (recoveryKitData.hasSentPayload) {
            handleSave(type, recoveryKitData);
            return;
        }
        void withLoading(
            (async () => {
                try {
                    const newRecoveryKitData = await dispatch(setRecoveryPhrase(recoveryKitData));
                    setRecoveryKitData(newRecoveryKitData);
                    handleSave(type, newRecoveryKitData);
                    // If it's the first time the onSuccess handler is triggered. Not on subsequent download triggers etc.
                    onSuccess?.();
                } catch (e) {
                    handleError(e);
                }
            })()
        );
    };

    return (
        <Modal size="medium" {...rest}>
            <ModalHeader title={c('Title').t`Download your recovery phrase`} />
            <ModalContent className="pb-6">
                {!recoveryKitData ? (
                    <div className="flex justify-center py-12">
                        <Loader />
                    </div>
                ) : (
                    <RecoveryKitContent
                        recoveryKitData={recoveryKitData}
                        loading={loading}
                        onSaveRecoveryKit={handleSaveRecoveryKit}
                        continueButton={() => (
                            <Button color="norm" size="large" fullWidth onClick={rest.onClose}>
                                {c('Action').t`Done`}
                            </Button>
                        )}
                    />
                )}
            </ModalContent>
        </Modal>
    );
};

const RecoveryKitModal = ({ open, onClose, onExit, onSuccess }: Props) => {
    const createMnemonicData = useSelector(selectMnemonicData);
    const [hasConfirmedRegenerate, setHasConfirmedRegenerate] = useState(!createMnemonicData.mnemonicCanBeRegenerated);

    return (
        <>
            {!hasConfirmedRegenerate && (
                <Prompt
                    open={open}
                    title={c('Title').t`Deactivate current phrase?`}
                    buttons={[
                        <Button
                            color="danger"
                            onClick={() => {
                                setHasConfirmedRegenerate(true);
                            }}
                        >
                            {c('Action').t`Continue`}
                        </Button>,
                        <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                    onClose={onClose}
                    onExit={onExit}
                >
                    <p className="m-0">
                        {c('Info').t`Generating a new recovery phrase will deactivate your current recovery phrase.`}
                    </p>
                </Prompt>
            )}
            {hasConfirmedRegenerate && (
                <DownloadRecoveryKitModal open={open} onClose={onClose} onExit={onExit} onSuccess={onSuccess} />
            )}
        </>
    );
};

export default RecoveryKitModal;
