import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import CopyRecoveryPhraseContainer from '../../../containers/recoveryPhrase/CopyRecoveryPhraseContainer';
import useRecoveryKitDownload from '../../../containers/recoveryPhrase/useRecoveryKitDownload';
import type { DeferredMnemonicData } from '../../../signup/interfaces';

interface Props {
    mnemonicData: DeferredMnemonicData;
    setApiRecoveryPhrase: () => Promise<void>;
    className?: string;
}

const RecoveryKitAction = ({ mnemonicData, setApiRecoveryPhrase, className }: Props) => {
    const { downloadRecoveryKit, downloadingRecoveryKit } = useRecoveryKitDownload({
        mnemonicData,
        setApiRecoveryPhrase,
    });
    const size = `(${humanSize({ bytes: mnemonicData.blob.size })})`;

    if (!downloadRecoveryKit) {
        /**
         * Fallback to copy functionality
         */
        return (
            <CopyRecoveryPhraseContainer
                className={className}
                recoveryPhrase={mnemonicData.recoveryPhrase}
                setApiRecoveryPhrase={setApiRecoveryPhrase}
            />
        );
    }

    return (
        <Button
            color="norm"
            shape="ghost"
            className={className}
            onClick={downloadRecoveryKit}
            loading={downloadingRecoveryKit}
        >
            <Icon name="arrow-down-line" className="mr-2" />
            {c('pass_signup_2023: Action').t`Download PDF ${size}`}
        </Button>
    );
};

export default RecoveryKitAction;
