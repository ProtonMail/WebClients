import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { RecoveryKitAction, type RecoveryKitActionProps } from '@proton/account/recovery/recoveryKit/RecoveryKitAction';
import type { DeferredMnemonicData } from '@proton/account/recovery/recoveryKit/generateDeferredMnemonicData';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';

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
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const handleSave: RecoveryKitActionProps['onSaveRecoveryKit'] = (type, recoveryKitData) => {
        recoveryKitData.save.handle(type);
        if (type === 'copy') {
            createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
        }
    };

    const handleSaveRecoveryKit: RecoveryKitActionProps['onSaveRecoveryKit'] = (type, recoveryKitData) => {
        if (hasSentPayload) {
            handleSave(type, recoveryKitData);
            return;
        }
        void withLoading(
            (async () => {
                try {
                    await sendRecoveryPhrasePayload();
                    handleSave(type, recoveryKitData);
                    setHasSentPayload(true);
                } catch (error) {
                    handleError(error);
                }
            })()
        );
    };

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
                recoveryKitData={
                    /* Ideally this would be updated in recoveryPhraseData state but that's non-trivial in signup */
                    { ...recoveryPhraseData, hasSentPayload }
                }
                onSaveRecoveryKit={handleSaveRecoveryKit}
                loading={loading}
                method={method}
            />

            {recoveryPhraseData.save.canDownloadRecoveryKit && (
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
