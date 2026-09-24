import { c } from 'ttag';

import { DriveStepModal } from './DriveStepModal';
import { TransferDestinationErrorIllustration } from './illustrations/TransferDestinationErrorIllustration';

interface Props {
    message?: string;
    onClose: () => void;
}

export const DriveImportGenericErrorStep = ({ message, onClose }: Props) => (
    <DriveStepModal
        onClose={onClose}
        media={<TransferDestinationErrorIllustration />}
        primaryAction={{ label: c('Action').t`Got it`, onClick: onClose }}
    >
        <h3 className="text-bold">{c('Title').t`Something went wrong`}</h3>
        <p className="color-weak mt-2 mb-0">
            {message || c('Info').t`An unexpected error occurred while importing your data. Please try again later.`}
        </p>
    </DriveStepModal>
);
