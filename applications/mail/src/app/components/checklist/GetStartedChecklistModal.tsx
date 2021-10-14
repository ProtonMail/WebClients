import { DialogModal, ModalCloseButton, InnerModal, ModalPropsInjection } from '@proton/components';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';

import GetStartedChecklist from './GetStartedChecklist';

const MailGetStartedChecklistModal = ({ onClose, ...rest }: Partial<ModalPropsInjection>) => {
    const onCompose = useOnCompose();

    return (
        <DialogModal intermediate onClose={onClose} {...rest}>
            <ModalCloseButton onClose={onClose} />
            <InnerModal className="modal-content pb2 pt2">
                <GetStartedChecklist
                    hideDismissButton
                    onSendMessage={() => {
                        onCompose({ action: MESSAGE_ACTIONS.NEW });
                        onClose?.();
                    }}
                />
            </InnerModal>
        </DialogModal>
    );
};

export default MailGetStartedChecklistModal;
