import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { RecoveryKitAction, type RecoveryKitActionProps } from './RecoveryKitAction';
import type { DeferredMnemonicData } from './generateDeferredMnemonicData';

type Method = 'recovery-kit' | 'text';

export interface RecoveryKitContentProps {
    recoveryKitData: DeferredMnemonicData;
    loading: boolean;
    continueButton: () => ReactNode;
    onSaveRecoveryKit: RecoveryKitActionProps['onSaveRecoveryKit'];
}

export const RecoveryKitContent = ({
    recoveryKitData,
    loading,
    continueButton,
    onSaveRecoveryKit,
}: RecoveryKitContentProps) => {
    const [method, setMethod] = useState<Method>('recovery-kit');

    const copyRecoverySwitchButton = (
        <InlineLinkButton
            key="copy-recovery-phrase-button"
            data-testid="switch-to-copy"
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
            data-testid="switch-to-pdf"
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
                recoveryKitData={recoveryKitData}
                loading={loading}
                onSaveRecoveryKit={onSaveRecoveryKit}
                method={method}
            />

            {recoveryKitData.save.canDownloadRecoveryKit && (
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
