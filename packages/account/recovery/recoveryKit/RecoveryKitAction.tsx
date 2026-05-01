import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { RECOVERY_KIT_FILE_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import recoveryKitPdf from '@proton/styles/assets/img/illustrations/recovery-kit-pdf.svg';
import clsx from '@proton/utils/clsx';

import { CopyRecoveryPhraseContainer } from './CopyRecoveryPhraseContainer';
import type { DeferredMnemonicData } from './generateDeferredMnemonicData';

export interface RecoveryKitActionProps {
    recoveryKitData: DeferredMnemonicData;
    onSaveRecoveryKit: (type: 'copy' | 'download', recoveryKitData: DeferredMnemonicData) => void;
    method: 'recovery-kit' | 'text';
    loading: boolean;
    cardClasses?: string;
}

export const RecoveryKitAction = ({
    recoveryKitData,
    onSaveRecoveryKit,
    method,
    loading,
    cardClasses = 'rounded-lg border border-solid border-norm shadow-raised bg-norm',
}: RecoveryKitActionProps) => {
    const {
        hasSentPayload,
        recoveryPhrase,
        save: { canDownloadRecoveryKit, recoveryKitBytes },
    } = recoveryKitData;

    if (!canDownloadRecoveryKit || method === 'text') {
        /**
         * Fallback to copy functionality
         */
        return (
            <CopyRecoveryPhraseContainer
                className={clsx(cardClasses, 'p-8 ')}
                recoveryPhrase={recoveryPhrase}
                loading={loading}
                onCopyPhrase={() => {
                    onSaveRecoveryKit('copy', recoveryKitData);
                }}
                hasSentPayload={hasSentPayload}
            />
        );
    }

    const size = humanSize({ bytes: recoveryKitBytes });

    return (
        <div className={clsx(cardClasses, 'p-5 pr-8 flex items-center gap-6')}>
            <div>
                <img src={recoveryKitPdf} alt="" />
            </div>
            <div className="flex-1">
                <div className="text-lg text-bold">{c('RecoveryPhrase: Info').t`Download PDF`}</div>
                <div className="color-weak">{RECOVERY_KIT_FILE_NAME}</div>
                <div className="color-weak text-sm">{size}</div>
            </div>
            <Button
                color={hasSentPayload ? 'weak' : 'norm'}
                shape={hasSentPayload ? 'outline' : 'solid'}
                icon
                pill
                size="large"
                onClick={() => {
                    onSaveRecoveryKit('download', recoveryKitData);
                }}
                loading={loading}
                data-testid="download-recovery-kit-button"
            >
                <IcArrowDownLine size={6} />
            </Button>
        </div>
    );
};
