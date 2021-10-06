import { DialogModal, ModalCloseButton, InnerModal, ModalPropsInjection } from '@proton/components';

import GetStartedChecklist from './GetStartedChecklist';

const MailGetStartedChecklistModal = ({ onClose, ...rest }: Partial<ModalPropsInjection>) => (
    <DialogModal intermediate onClose={onClose} {...rest}>
        <ModalCloseButton onClose={onClose} />
        <InnerModal className="modal-content pb2 pt2">
            <GetStartedChecklist hideDismissButton />
        </InnerModal>
    </DialogModal>
);

export default MailGetStartedChecklistModal;
