import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcArrowDownLine } from '@proton/icons';
import { RECOVERY_KIT_FILE_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import recoveryKitPdf from '../assets/recovery-kit-pdf.svg';
import type useRecoveryKitDownload from '../useRecoveryKitDownload';
import CopyRecoveryPhraseContainer from './CopyRecoveryPhraseContainer';

interface Props {
    recoveryPhrase: string;
    sendPayload: () => Promise<void>;
    method: 'recovery-kit' | 'text';
    recoveryKitDownload: ReturnType<typeof useRecoveryKitDownload>;
    hasSentPayload: boolean;
}

const RecoveryKitAction = ({ recoveryPhrase, recoveryKitDownload, sendPayload, method, hasSentPayload }: Props) => {
    const { canDownloadRecoveryKit, downloadRecoveryKit, downloadingRecoveryKit, recoveryKitBlobToDownload } =
        recoveryKitDownload;

    const cardClasses = 'rounded-lg border border-solid border-norm shadow-raised bg-norm';

    if (!canDownloadRecoveryKit || method === 'text') {
        /**
         * Fallback to copy functionality
         */
        return (
            <CopyRecoveryPhraseContainer
                className={clsx(cardClasses, 'p-8 ')}
                recoveryPhrase={recoveryPhrase}
                sendPayload={sendPayload}
                hasSentPayload={hasSentPayload}
            />
        );
    }

    const size = humanSize({ bytes: recoveryKitBlobToDownload.size });

    return (
        <div className={clsx(cardClasses, 'p-5 pr-8 flex items-center gap-6')}>
            <div>
                <img src={recoveryKitPdf} alt="" />
            </div>
            <div className="flex-1">
                <div className="text-lg text-bold">{c('RecoveryPhrase: Info').t`Download PDF`}</div>
                <div className="color-hint">{RECOVERY_KIT_FILE_NAME}</div>
                <div className="color-hint text-sm">{size}</div>
            </div>
            <Button
                color={hasSentPayload ? 'weak' : 'norm'}
                shape={hasSentPayload ? 'outline' : 'solid'}
                icon
                pill
                size="large"
                onClick={downloadRecoveryKit}
                loading={downloadingRecoveryKit}
            >
                <IcArrowDownLine size={6} />
            </Button>
        </div>
    );
};

export default RecoveryKitAction;
