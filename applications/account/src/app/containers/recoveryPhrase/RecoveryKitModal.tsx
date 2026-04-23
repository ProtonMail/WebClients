import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { userThunk } from '@proton/account/user';
import { useUser } from '@proton/account/user/hooks';
import { userKeysThunk } from '@proton/account/userKeys';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import Prompt from '@proton/components/components/prompt/Prompt';
import AuthModal from '@proton/components/containers/password/AuthModal';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { reactivateMnemonicPhrase, updateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import RecoveryKitAction from './components/RecoveryKitAction';
import generateDeferredMnemonicData from './generateDeferredMnemonicData';
import type { DeferredMnemonicData } from './types';
import useRecoveryKitDownload from './useRecoveryKitDownload';

type Method = 'recovery-kit' | 'text';

interface RecoveryKitContentProps {
    recoveryPhraseData: DeferredMnemonicData;
    continueButton: () => ReactNode;
}

const RecoveryKitContent = ({ recoveryPhraseData, continueButton }: RecoveryKitContentProps) => {
    const [hasAcknowledged, setHasAcknowledged] = useState(false);
    const [method, setMethod] = useState<Method>('recovery-kit');

    // The payload is already saved to the backend before this content is shown.
    // This callback only tracks whether the user has downloaded/copied the phrase,
    // which changes the download button appearance.
    const onPhraseAcknowledged = async () => {
        setHasAcknowledged(true);
    };

    const recoveryKitDownload = useRecoveryKitDownload({
        recoveryKitBlob: recoveryPhraseData.recoveryKitBlob,
        sendPayload: onPhraseAcknowledged,
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
                hasSentPayload={hasAcknowledged}
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

interface Props {
    open: ModalProps['open'];
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
    onSuccess?: () => void;
}

const RecoveryKitModal = ({ open, onClose, onExit, onSuccess }: Props) => {
    const [{ Name, MnemonicStatus }] = useUser();
    const [addresses] = useAddresses();
    const mnemonicData = useSelector(selectMnemonicData);
    const shouldConfirmRegenerate = mnemonicData.mnemonicCanBeRegenerated;

    const callReactivateEndpoint =
        MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        MnemonicStatus === MNEMONIC_STATUS.OUTDATED ||
        MnemonicStatus === MNEMONIC_STATUS.PROMPT;

    const api = useApi();
    const dispatch = useDispatch();
    const [generating, withGenerating] = useLoading();
    const [saving, withSaving] = useLoading();
    const [deferredData, setDeferredData] = useState<DeferredMnemonicData>();
    const [isRecoveryKitReady, setIsRecoveryKitReady] = useState(false);
    const [hasConfirmedRegenerate, setHasConfirmedRegenerate] = useState(!shouldConfirmRegenerate);
    const [authOpen, setAuthOpen] = useState(false);
    const [hasSavedRecoveryPhrase, setHasSavedRecoveryPhrase] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const prepPromiseRef = useRef<Promise<DeferredMnemonicData> | null>(null);

    const emailAddress = addresses?.[0]?.Email || Name;

    const resetFlow = useCallback(() => {
        prepPromiseRef.current = null;
        setDeferredData(undefined);
        setIsRecoveryKitReady(false);
        setHasConfirmedRegenerate(!shouldConfirmRegenerate);
        setAuthOpen(false);
        setHasSavedRecoveryPhrase(false);
        setHasStarted(false);
    }, [shouldConfirmRegenerate]);

    const ensureDeferredData = useCallback(() => {
        if (!prepPromiseRef.current) {
            prepPromiseRef.current = (async () => {
                const data = await withGenerating(() =>
                    generateDeferredMnemonicData({
                        api,
                        emailAddress,
                        username: Name,
                        getUserKeys: () => dispatch(userKeysThunk()),
                    })
                );

                if (!data) {
                    throw new Error('Failed to prepare recovery kit data');
                }

                setDeferredData(data);
                return data;
            })();
        }

        return prepPromiseRef.current as Promise<DeferredMnemonicData>;
    }, [withGenerating, dispatch, api, Name, emailAddress]);

    const handleFailure = useCallback(() => {
        onClose?.();
    }, [onClose]);

    const handleAuthClose = useCallback(() => {
        setAuthOpen(false);
    }, []);

    const startFlow = useCallback(() => {
        if (hasStarted) {
            return;
        }

        setHasStarted(true);

        if (!callReactivateEndpoint) {
            setAuthOpen(true);
            void ensureDeferredData();
            return;
        }

        setIsRecoveryKitReady(true);
        void withSaving(async () => {
            try {
                const data = await ensureDeferredData();
                await api(reactivateMnemonicPhrase(data.payload));
                await dispatch(userThunk({ cache: CacheType.None }));
                setHasSavedRecoveryPhrase(true);
                onSuccess?.();
            } catch (e) {
                handleFailure();
            }
        });
    }, [hasStarted, callReactivateEndpoint, ensureDeferredData, withSaving, api, dispatch, onSuccess, handleFailure]);

    const handleAuthSuccess = useCallback(() => {
        setAuthOpen(false);
        setIsRecoveryKitReady(true);

        void withSaving(async () => {
            try {
                const data = await ensureDeferredData();
                await api(updateMnemonicPhrase(data.payload));
                await dispatch(userThunk({ cache: CacheType.None }));
                await api(lockSensitiveSettings());
                setHasSavedRecoveryPhrase(true);
                onSuccess?.();
            } catch (e) {
                handleFailure();
            }
        });
    }, [withSaving, ensureDeferredData, api, dispatch, onSuccess, handleFailure]);

    useEffect(() => {
        if (!open) {
            resetFlow();
            return;
        }

        if (hasConfirmedRegenerate && !hasStarted) {
            startFlow();
        }
    }, [open, hasConfirmedRegenerate, hasStarted, startFlow, resetFlow]);

    const handleClose = generating || saving ? noop : onClose;
    const recoveryKitLoading = generating || saving || !deferredData || !hasSavedRecoveryPhrase;

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
            {authOpen && (
                <AuthModal
                    open={authOpen}
                    scope="password"
                    config={unlockPasswordChanges()}
                    onClose={handleAuthClose}
                    onExit={onExit}
                    onCancel={handleFailure}
                    onSuccess={handleAuthSuccess}
                />
            )}
            {isRecoveryKitReady && (
                <Modal size="medium" open={open} onClose={handleClose} onExit={onExit}>
                    <ModalHeader title={c('Title').t`Download your Recovery Kit`} />
                    <ModalContent className="pb-6">
                        {recoveryKitLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader />
                            </div>
                        ) : (
                            <RecoveryKitContent
                                recoveryPhraseData={deferredData}
                                continueButton={() => (
                                    <Button color="norm" size="large" fullWidth onClick={onClose}>
                                        {c('Action').t`Done`}
                                    </Button>
                                )}
                            />
                        )}
                    </ModalContent>
                </Modal>
            )}
        </>
    );
};

export default RecoveryKitModal;
