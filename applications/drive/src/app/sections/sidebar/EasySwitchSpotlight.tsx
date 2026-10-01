import { c } from 'ttag';

import { DriveStepModalContent } from '@proton/activation/src/components/Modals/OAuth/Drive/DriveStepModal';
import { TransferLockIllustration } from '@proton/activation/src/components/Modals/OAuth/Drive/illustrations/TransferLockIllustration';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { TargetSpotlight } from '../../statelessComponents/TargetSpotlight/TargetSpotlight';

interface EasySwitchSpotlightProps {
    target: HTMLElement;
    onClose: () => void;
    onImport: () => void;
}

export const EasySwitchSpotlight = ({ target, onClose, onImport }: EasySwitchSpotlightProps) => (
    <TargetSpotlight target={target} onClose={onClose} placement="right-start">
        <DriveStepModalContent
            media={<TransferLockIllustration />}
            secondaryAction={{ label: c('Action').t`Maybe later`, onClick: onClose, color: 'weak' }}
            primaryAction={{ label: c('Action').t`Import now`, onClick: onImport }}
        >
            <h3 className="text-bold">{c('Title').t`Bring your Google Drive files to ${DRIVE_APP_NAME}`}</h3>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`Import your files and folders from Google Drive and keep them private in ${DRIVE_APP_NAME}.`}</p>
        </DriveStepModalContent>
    </TargetSpotlight>
);
