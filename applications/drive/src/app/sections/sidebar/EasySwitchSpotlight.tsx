import { c } from 'ttag';

import { TransferLockIllustration } from '@proton/activation/src/components/Modals/OAuth/Drive/illustrations/TransferLockIllustration';
import { Button } from '@proton/atoms/Button/Button';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { TargetSpotlight } from '../../statelessComponents/TargetSpotlight/TargetSpotlight';

interface EasySwitchSpotlightProps {
    target: HTMLElement;
    onClose: () => void;
    onImport: () => void;
}

export const EasySwitchSpotlight = ({ target, onClose, onImport }: EasySwitchSpotlightProps) => (
    <TargetSpotlight target={target} onClose={onClose} placement="right-start">
        <ModalHeaderCloseButton buttonProps={{ className: 'absolute top-0 right-0 mt-2 mr-2' }} />
        <TransferLockIllustration />
        <ModalContent className="px-2 pt-4">
            <h3 className="text-bold">{c('Title').t`Bring your Google Drive files to ${DRIVE_APP_NAME}`}</h3>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`Import your files and folders from Google Drive and keep them private in ${DRIVE_APP_NAME}.`}</p>
        </ModalContent>
        <ModalFooter className="flex justify-end gap-2 m-4">
            <Button className="m-0" shape="ghost" color="weak" onClick={onClose}>
                {c('Action').t`Maybe later`}
            </Button>
            <Button className="m-0" color="norm" onClick={onImport}>
                {c('Action').t`Import now`}
            </Button>
        </ModalFooter>
    </TargetSpotlight>
);
