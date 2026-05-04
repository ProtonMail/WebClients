import type { ReactNode } from 'react';

import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { RecoveryKitAction, type RecoveryKitActionProps } from './RecoveryKitAction';
import type { DeferredMnemonicData } from './generateDeferredMnemonicData';

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
    return (
        <div className="flex flex-column gap-6">
            <RecoveryKitAction
                cardClasses="rounded-xl border border-solid border-norm"
                recoveryKitData={recoveryKitData}
                loading={loading}
                onSaveRecoveryKit={onSaveRecoveryKit}
            />

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
