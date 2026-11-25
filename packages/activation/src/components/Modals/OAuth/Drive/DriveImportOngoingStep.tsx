import { c } from 'ttag';

import humanSize from '@proton/shared/lib/helpers/humanSize';

import { EasySwitchStepModal } from '../../EasySwitchStepModal/EasySwitchStepModal';
import { TransferringIllustration } from './illustrations/TransferringIllustration';

interface Props {
    importedBytes: number;
    onClose: () => void;
}

export const DriveImportOngoingStep = ({ importedBytes, onClose }: Props) => {
    const importedSize = <strong key="imported-size">{humanSize({ bytes: importedBytes })}</strong>;

    return (
        <EasySwitchStepModal
            onClose={onClose}
            media={<TransferringIllustration />}
            primaryAction={{ label: c('Action').t`Got it`, onClick: onClose }}
            title={c('Title').t`Your import is in progress`}
        >
            <p className="color-weak m-0">
                {importedBytes > 0
                    ? c('Info')
                          .jt`You can open this folder when the import is finished. So far, we've imported ${importedSize}. We'll email you when it's done.`
                    : c('Info')
                          .t`You can open this folder when the import is finished. We'll email you when it's done.`}
            </p>
        </EasySwitchStepModal>
    );
};
