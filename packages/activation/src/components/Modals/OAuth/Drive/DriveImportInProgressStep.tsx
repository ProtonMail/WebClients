import { c } from 'ttag';

import { VideoInstructions } from '@proton/components';

import { DriveStepModal } from './DriveStepModal';
import transferringMp4 from './illustrations/transferring.mp4';
import transferringWebm from './illustrations/transferring.webm';

interface Props {
    onClose: () => void;
}

export const DriveImportInProgressStep = ({ onClose }: Props) => (
    <DriveStepModal
        onClose={onClose}
        media={
            <VideoInstructions loop>
                <source src={transferringWebm} type="video/webm" />
                <source src={transferringMp4} type="video/mp4" />
            </VideoInstructions>
        }
        primaryAction={{ label: c('Action').t`Got it`, onClick: onClose }}
    >
        <h3 className="text-bold">{c('Title').t`Your import is in progress`}</h3>
        <p className="color-weak mt-2 mb-0">{c('Info')
            .t`We're importing your files from Google Drive. We'll let you know once it's done.`}</p>
    </DriveStepModal>
);
