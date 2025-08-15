import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { useErrorHandler } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import RecoveryKitAction from './components/RecoveryKitAction';
import type { DeferredMnemonicData } from './types';
import useRecoveryKitDownload from './useRecoveryKitDownload';

type Method = 'recovery-kit' | 'text';
export interface SetRecoveryPhraseOnSignupContainerProps {
    recoveryPhraseData: DeferredMnemonicData;
    sendRecoveryPhrasePayload: () => Promise<void>;
    title?: (method: Method) => ReactNode;
    continueButton: () => ReactNode;
}

/**
 * To be used in the recovery step of the signup flow
 * If you need customisation, use this as a baseline and consume useRecoveryKitDownload yourself
 */
const SetRecoveryPhraseOnSignupContainer = ({
    recoveryPhraseData,
    sendRecoveryPhrasePayload,
    title,
    continueButton,
}: SetRecoveryPhraseOnSignupContainerProps) => {
    const handleError = useErrorHandler();

    const [hasSentPayload, setHasSentPayload] = useState(false);

    const sendPayload = async () => {
        if (hasSentPayload) {
            return;
        }

        try {
            await sendRecoveryPhrasePayload();
            setHasSentPayload(true);
        } catch (error) {
            handleError(error);
            throw error;
        }
    };

    const recoveryKitDownload = useRecoveryKitDownload({
        recoveryKitBlob: recoveryPhraseData.recoveryKitBlob,
        sendPayload,
    });
    const { canDownloadRecoveryKit } = recoveryKitDownload;

    const [method, setMethod] = useState<Method>('recovery-kit');

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
        <div className="flex flex-column gap-8">
            <div className="flex flex-column gap-4">
                {title?.(method)}
                <div>
                    {getBoldFormattedText(
                        c('RecoveryPhrase: Info')
                            .t`Your **Recovery Kit** lets you restore your ${BRAND_NAME} Account if you’re locked out.`
                    )}
                </div>
                <div>
                    {getBoldFormattedText(
                        c('RecoveryPhrase: Info').t`It’s the only way to recover everything—store it safely.`
                    )}
                </div>
            </div>

            <RecoveryKitAction
                recoveryPhrase={recoveryPhraseData.recoveryPhrase}
                recoveryKitDownload={recoveryKitDownload}
                hasSentPayload={hasSentPayload}
                sendPayload={sendPayload}
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

            {continueButton()}
        </div>
    );
};

export default SetRecoveryPhraseOnSignupContainer;
