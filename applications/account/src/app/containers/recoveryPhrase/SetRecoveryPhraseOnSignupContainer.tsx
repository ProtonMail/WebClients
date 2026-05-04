import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { RecoveryKitAction, type RecoveryKitActionProps } from '@proton/account/recovery/recoveryKit/RecoveryKitAction';
import type { DeferredMnemonicData } from '@proton/account/recovery/recoveryKit/generateDeferredMnemonicData';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';

export interface SetRecoveryPhraseOnSignupContainerProps {
    recoveryPhraseData: DeferredMnemonicData;
    sendRecoveryPhrasePayload: () => Promise<void>;
    title?: ReactNode;
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

    return (
        <div className="flex flex-column gap-8">
            <div className="flex flex-column gap-4">
                {title}
                <div>
                    {getBoldFormattedText(
                        c('RecoveryPhrase: Info')
                            .t`Your **recovery phrase** lets you restore your ${BRAND_NAME} Account if you’re locked out.`
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
            />

            {continueButton()}
        </div>
    );
};

export default SetRecoveryPhraseOnSignupContainer;
