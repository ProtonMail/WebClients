import { c } from 'ttag';

import { AlertModal, Button, ErrorButton } from '@proton/components';

interface Props {
    onResolve: () => void;
    onReject: () => void;
}

const SendingOriginalMessageModal = ({ onResolve, onReject, ...rest }: Props) => {
    return (
        <AlertModal
            title={c('Title').t`Sending original message`}
            buttons={[
                <ErrorButton onClick={onResolve}>{c('Action').t`OK`}</ErrorButton>,
                <Button onClick={onReject}>{c('Action').t`Close`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`The original message you are trying to forward / reply to is in the process of being sent. If you continue, you will not be able to undo sending of the original message any longer.`}
        </AlertModal>
    );
};

export default SendingOriginalMessageModal;
