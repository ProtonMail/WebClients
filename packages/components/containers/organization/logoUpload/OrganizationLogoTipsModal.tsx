import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';

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
