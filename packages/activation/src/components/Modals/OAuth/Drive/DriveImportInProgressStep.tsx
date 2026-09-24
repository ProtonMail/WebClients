import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { DriveStepModal } from './DriveStepModal';
import { TransferringIllustration } from './illustrations/TransferringIllustration';

interface Props {
    onClose: () => void;
}

export const DriveImportInProgressStep = ({ onClose }: Props) => (
    <DriveStepModal
        onClose={onClose}
        media={<TransferringIllustration />}
        primaryAction={{ label: c('Action').t`Got it`, onClick: onClose }}
    >
        <h3 className="text-bold">{c('Title').t`Import started`}</h3>
        <p className="color-weak mt-2 mb-0">{c('Info')
            .t`We'll email you when your import is complete. Your files will appear in a folder in ${DRIVE_APP_NAME}.`}</p>
        <p className="mt-2 mb-0">
            <Href href={getKnowledgeBaseUrl('/import-files-google-drive')}>{c('Link').t`Learn more`}</Href>
        </p>
    </DriveStepModal>
);
