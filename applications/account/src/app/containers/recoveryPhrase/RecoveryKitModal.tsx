import { type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { userThunk } from '@proton/account/user';
import { userKeysThunk } from '@proton/account/userKeys';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import Prompt from '@proton/components/components/prompt/Prompt';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { reactivateMnemonicPhrase, updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import RecoveryKitAction from './components/RecoveryKitAction';
import generateDeferredMnemonicData from './generateDeferredMnemonicData';
import type { DeferredMnemonicData } from './types';
import useRecoveryKitDownload from './useRecoveryKitDownload';

type Method = 'recovery-kit' | 'text';

interface RecoveryKitContentProps {
    recoveryPhraseData: DeferredMnemonicData;
    continueButton: () => ReactNode;
    onPhraseAcknowledged: () => Promise<void>;
}

const RecoveryKitContent = ({ recoveryPhraseData, continueButton, onPhraseAcknowledged }: RecoveryKitContentProps) => {
    const [hasSentPayload, setHasSentPayload] = useState(false);
    const [method, setMethod] = useState<Method>('recovery-kit');

    const handlePhraseAcknowledged = async () => {
        await onPhraseAcknowledged();
        setHasSentPayload(true);
    };

    const recoveryKitDownload = useRecoveryKitDownload({
        recoveryKitBlob: recoveryPhraseData.recoveryKitBlob,
        sendPayload: handlePhraseAcknowledged,
    });
    const { canDownloadRecoveryKit } = recoveryKitDownload;

    const copyRecoverySwitchButton = (
        <InlineLinkButton
            key="copy-recovery-phrase-button"
            onClick={() => {
                setMethod('text');
            }}
        >
            {
                // translator: Full sentence "Or copy recovery phrase as text."
                c('RecoveryPhrase: Info').t`copy recovery phrase`
            }
        </InlineLinkButton>
    );

    const downloadRecoveryKitSwitchButton = (
        <InlineLinkButton
            key="download-pdf-button"
            onClick={() => {
                setMethod('recovery-kit');
            }}
        >
            {
                // translator: Full sentence "Or download PDF instead."
                c('RecoveryPhrase: Info').t`download PDF`
            }
        </InlineLinkButton>
    );

    return (
        <div className="flex flex-column gap-6">
            <RecoveryKitAction
                cardClasses="rounded-xl border border-solid border-norm"
                recoveryPhrase={recoveryPhraseData.recoveryPhrase}
                recoveryKitDownload={recoveryKitDownload}
                hasSentPayload={hasSentPayload}
                sendPayload={onPhraseAcknowledged}
                method={method}
            />

            {canDownloadRecoveryKit && (
                <div>
                    {method === 'recovery-kit' &&
                        // translator: Full sentence "Or copy recovery phrase as text."
                        c('RecoveryPhrase: Info').jt`Or ${copyRecoverySwitchButton} as text.`}

                    {method === 'text' &&
                        // translator: Full sentence "Or download PDF instead."
                        c('RecoveryPhrase: Info').jt`Or ${downloadRecoveryKitSwitchButton} instead.`}
                </div>
            )}

            <p className="m-0">
                {getBoldFormattedText(
                    c('RecoveryPhrase: Info')
                        .t`**Make sure you keep your recovery phrase accessible after creating it.** For security reasons, we do not store the phrase after saving your changes, and you won’t be able to see it again in the ${BRAND_NAME} app.`
                )}
            </p>

            {continueButton()}
        </div>
    );
};

interface Props extends Omit<ModalProps<'div'>, 'children' | 'buttons'> {
    onSuccess: () => void;
    createMnemonicData: ReturnType<typeof selectMnemonicData>;
}

const DownloadRecoveryKitModal = ({ onSuccess, createMnemonicData, ...rest }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const [recoveryPhraseData, setRecoveryPhraseData] = useState<DeferredMnemonicData | null>(null);

    useEffect(() => {
        const getDeferredData = async () => {
            const data = await generateDeferredMnemonicData({
                api,
                emailAddress: createMnemonicData.emailAddress,
                username: createMnemonicData.username,
                getUserKeys: () => dispatch(userKeysThunk()),
            });
            if (!data) {
                throw new Error('Failed to prepare recovery kit data');
            }
            return data;
        };

        getDeferredData()
            .then((data) => {
                setRecoveryPhraseData(data);
            })
            .catch((e) => {
                handleError(e);
                // Close as there's nothing meaninful to do at this point
                rest.onClose?.();
            });
    }, []);

    const handleDownload = async (recoveryPhraseData: DeferredMnemonicData) => {
        if (!createMnemonicData.callReactivateEndpoint) {
            await api(updateMnemonicPhrase(recoveryPhraseData.payload));
            await dispatch(userThunk({ cache: CacheType.None }));
            onSuccess?.();
        } else {
            await api(reactivateMnemonicPhrase(recoveryPhraseData.payload));
            await dispatch(userThunk({ cache: CacheType.None }));
            onSuccess?.();
        }
    };

    return (
        <Modal size="medium" {...rest}>
            <ModalHeader title={c('Title').t`Download your Recovery Kit`} />
            <ModalContent className="pb-6">
                {!recoveryPhraseData ? (
                    <div className="flex justify-center py-12">
                        <Loader />
                    </div>
                ) : (
                    <RecoveryKitContent
                        onPhraseAcknowledged={async () => {
                            try {
                                await handleDownload(recoveryPhraseData);
                            } catch (e) {
                                handleError(e);
                                throw e;
                            }
                        }}
                        recoveryPhraseData={recoveryPhraseData}
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
                <DownloadRecoveryKitModal
                    createMnemonicData={createMnemonicData}
                    open={open}
                    onClose={onClose}
                    onExit={onExit}
                    onSuccess={onSuccess}
                />
            )}
        </>
    );
};

export default RecoveryKitModal;
