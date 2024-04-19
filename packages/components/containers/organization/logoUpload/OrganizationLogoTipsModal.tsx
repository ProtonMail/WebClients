import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
} from '@proton/components';

import OrganizationLogoTips from './OrganizationLogoTips';

interface Props extends ModalProps {
    onUploadClick: () => void;
}

const OrganizationLogoTipsModal = ({ onClose, onUploadClick, ...rest }: Props) => {
    const handleUploadClick = () => {
        onUploadClick();
        onClose?.();
    };

    return (
        <Modal onClose={onClose} {...rest}>
            <ModalHeader title={c('Title').t`How to choose a good logo`} />
            <ModalContent>
                <OrganizationLogoTips />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleUploadClick}>{c('Action').t`Upload logo`}</Button>
                <Button onClick={onClose} color="norm">
                    {c('Action').t`Got it`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default OrganizationLogoTipsModal;
