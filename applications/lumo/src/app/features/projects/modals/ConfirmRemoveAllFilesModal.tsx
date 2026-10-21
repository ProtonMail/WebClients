import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

interface ConfirmRemoveAllFilesModalProps {
    open: boolean;
    fileCount: number;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmRemoveAllFilesModal = ({
    open,
    fileCount,
    onClose,
    onConfirm,
}: ConfirmRemoveAllFilesModalProps) => (
    <ModalTwo onClose={onClose} size="small" open={open}>
        <ModalTwoHeader title={c('collider_2025:Title').t`Remove all files?`} />
        <ModalTwoContent>
            <p className="m-0">
                {c('collider_2025:Info')
                    .t`This will remove all ${fileCount} files from this project. This action cannot be undone.`}
            </p>
        </ModalTwoContent>
        <ModalTwoFooter>
            <Button type="button" onClick={onClose}>
                {c('Action').t`Cancel`}
            </Button>
            <Button color="danger" onClick={onConfirm}>
                {c('collider_2025:Action').t`Remove all`}
            </Button>
        </ModalTwoFooter>
    </ModalTwo>
);
