import { c } from 'ttag';

import { EasySwitchStepModal } from '../../EasySwitchStepModal/EasySwitchStepModal';
import { TransferDestinationErrorIllustration } from './illustrations/TransferDestinationErrorIllustration';

interface Props {
    message?: string;
    onClose: () => void;
}

export const DriveImportGenericErrorStep = ({ message, onClose }: Props) => (
    <EasySwitchStepModal
        onClose={onClose}
        media={<TransferDestinationErrorIllustration />}
        primaryAction={{ label: c('Action').t`Got it`, onClick: onClose }}
        title={c('Title').t`Something went wrong`}
    >
        <p className="color-weak m-0">
            {message || c('Info').t`An unexpected error occurred while importing your data. Please try again later.`}
        </p>
    </EasySwitchStepModal>
);
