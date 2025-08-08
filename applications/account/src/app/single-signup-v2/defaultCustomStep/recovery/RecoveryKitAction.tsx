import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import CopyRecoveryPhraseContainer from '../../../containers/recoveryPhrase/CopyRecoveryPhraseContainer';
import type { RecoveryKitBlob } from '../../../containers/recoveryPhrase/types';
import useRecoveryKitDownload from '../../../containers/recoveryPhrase/useRecoveryKitDownload';

interface Props {
    recoveryPhrase: string;
    recoveryKitBlob: RecoveryKitBlob | null;
    setApiRecoveryPhrase: () => Promise<void>;
    className?: string;
}

const RecoveryKitAction = ({ recoveryPhrase, recoveryKitBlob, setApiRecoveryPhrase, className }: Props) => {
    const { canDownloadRecoveryKit, downloadRecoveryKit, downloadingRecoveryKit, recoveryKitBlobToDownload } =
        useRecoveryKitDownload({
            recoveryKitBlob,
            setApiRecoveryPhrase,
        });

    if (!canDownloadRecoveryKit) {
        /**
         * Fallback to copy functionality
         */
        return (
            <CopyRecoveryPhraseContainer
                className={className}
                recoveryPhrase={recoveryPhrase}
                setApiRecoveryPhrase={setApiRecoveryPhrase}
            />
        );
    }

    const size = `(${humanSize({ bytes: recoveryKitBlobToDownload.size })})`;

    return (
        <Button
            color="norm"
            shape="ghost"
            className={clsx('inline-flex items-center', className)}
            onClick={downloadRecoveryKit}
            loading={downloadingRecoveryKit}
        >
            <Icon name="arrow-down-line" className="mr-2" />
            {c('RecoveryPhrase: Action').t`Download PDF ${size}`}
        </Button>
    );
};

export default RecoveryKitAction;
