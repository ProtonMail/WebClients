import { c } from 'ttag';

import { AlertModal, Button, ModalProps } from '@proton/components';

interface Props extends ModalProps {
    isMessage: boolean;
    onResolve: () => void;
    onReject: () => void;
    onCloseCustomAction?: () => void;
}

const MoveScheduledModal = ({ isMessage, onResolve, onReject, onCloseCustomAction, ...rest }: Props) => {
    const text = isMessage
        ? c('Info').t`Scheduled send of this message will be cancelled.`
        : c('Info').t`This conversation contains a scheduled message. Sending of this message will be cancelled.`;

    const handleClose = () => {
        onCloseCustomAction?.();
        onReject();
    };

    return (
        <AlertModal
            title={c('Title').t`Moving a scheduled message`}
            buttons={[
                <Button color="norm" onClick={onResolve}>{c('Action').t`OK`}</Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {text}
        </AlertModal>
    );
};
export default MoveScheduledModal;
