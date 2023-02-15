import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalProps, Prompt } from '@proton/components';

interface Props extends ModalProps {
    isMessage: boolean;
    onResolve: () => void;
    onReject: () => void;
    onCloseCustomAction?: () => void;
}

const MoveScheduledModal = ({ isMessage, onResolve, onReject, onCloseCustomAction, ...rest }: Props) => {
    const text = isMessage
        ? c('Info').t`Scheduled send of this message will be canceled.`
        : c('Info').t`This conversation contains a scheduled message. Sending of this message will be canceled.`;

    const handleClose = () => {
        onCloseCustomAction?.();
        onReject();
    };

    return (
        <Prompt
            title={c('Title').t`Moving a scheduled message`}
            buttons={[
                <Button color="norm" onClick={onResolve}>{c('Action').t`OK`}</Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {text}
        </Prompt>
    );
};
export default MoveScheduledModal;
