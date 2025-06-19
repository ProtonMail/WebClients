import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Prompt } from '@proton/components';

interface Props {
    onResolve: () => void;
    onReject: () => void;
}

const SendingOriginalMessageModal = ({ onResolve, onReject, ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`Sending original message`}
            buttons={[
                <Button color="danger" onClick={onResolve} data-testid="send-original-message:confirm">{c('Action')
                    .t`OK`}</Button>,
                <Button onClick={onReject}>{c('Action').t`Close`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`The original message you are trying to forward / reply to is in the process of being sent. If you continue, you will not be able to undo sending of the original message any longer.`}
        </Prompt>
    );
};

export default SendingOriginalMessageModal;
