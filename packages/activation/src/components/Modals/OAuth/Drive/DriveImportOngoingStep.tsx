import { c } from 'ttag';

import humanSize from '@proton/shared/lib/helpers/humanSize';

import { DriveStepModal } from './DriveStepModal';
import { TransferringIllustration } from './illustrations/TransferringIllustration';

interface Props {
    importedBytes: number;
    onClose: () => void;
}

export const DriveImportOngoingStep = ({ importedBytes, onClose }: Props) => {
    const importedSize = <strong key="imported-size">{humanSize({ bytes: importedBytes })}</strong>;

    return (
        <DriveStepModal
            onClose={onClose}
            media={<TransferringIllustration />}
            primaryAction={{ label: c('Action').t`Got it`, onClick: onClose }}
        >
            <h3 className="text-bold">{c('Title').t`Your import is in progress`}</h3>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .jt`You can open this folder when the import is finished. So far, we've imported ${importedSize}. We'll email you when it's done.`}</p>
        </DriveStepModal>
    );
};
