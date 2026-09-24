import { c } from 'ttag';

import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { DriveStepModal } from './DriveStepModal';
import { TransferFinishIllustration } from './illustrations/TransferFinishIllustration';

interface Props {
    onClose: () => void;
    // onGoToFolder: () => void;
}

export const DriveImportSuccessStep = ({ onClose }: Props) => (
    <DriveStepModal
        onClose={onClose}
        media={<TransferFinishIllustration />}
        // TODO: Go to folder action needs BE change and will be implemented later
        // secondaryAction={{ label: c('Action').t`Go to folder`, onClick: onGoToFolder }}
        primaryAction={{ label: c('Action').t`Got it`, onClick: onClose }}
    >
        <h3 className="text-bold">{c('Title').t`Your import is finished!`}</h3>
        <p className="color-weak mt-2 mb-0">{c('Info')
            .t`Your files have been successfully imported and encrypted from Google Drive to ${DRIVE_APP_NAME}.`}</p>
    </DriveStepModal>
);
