import { c } from 'ttag';

import { displayConfirmLeaveModal, resetImapDraft } from '@proton/activation/logic/draft/imapDraft/imapDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/logic/store';
import { Button } from '@proton/atoms/Button';
import { Alert, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';

const ConfirmLeaveModal = () => {
    const dispatch = useEasySwitchDispatch();

    const handleClose = () => {
        dispatch(resetImapDraft());
    };
    const handleContinueEdit = () => {
        dispatch(displayConfirmLeaveModal(false));
    };

    return (
        <ModalTwo key="easy-switch-confirm-leave-modal" className="easy-switch-modal" open onClose={handleContinueEdit}>
            <ModalTwoHeader title={c('Confirm modal title').t`Quit import?`} />
            <ModalTwoContent>
                <div className="mb1">{c('Info').t`Your import will not be processed.`}</div>
                <Alert className="mb1" type="error">{c('Warning')
                    .t`Are you sure you want to discard your import?`}</Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="danger" onClick={handleClose}>{c('Action').t`Discard`}</Button>
                <Button color="norm" onClick={handleContinueEdit}>{c('Action').t`Continue import`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ConfirmLeaveModal;
