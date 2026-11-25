import { c } from 'ttag';

import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { EasySwitchStepModal } from '../../EasySwitchStepModal/EasySwitchStepModal';
import { TransferFinishIllustration } from './illustrations/TransferFinishIllustration';

interface Props {
    onClose: () => void;
    onGoToFolder?: () => void;
}

export const DriveImportSuccessStep = ({ onClose, onGoToFolder }: Props) => (
    <EasySwitchStepModal
        onClose={onClose}
        media={<TransferFinishIllustration />}
        secondaryAction={onGoToFolder && { label: c('Action').t`Go to folder`, onClick: onGoToFolder }}
        primaryAction={{ label: c('Action').t`Got it`, onClick: onClose }}
        title={c('Title').t`Your import is finished!`}
    >
        <p className="color-weak m-0">{c('Info')
            .t`Your files have been successfully imported and encrypted from Google Drive to ${DRIVE_APP_NAME}.`}</p>
    </EasySwitchStepModal>
);
