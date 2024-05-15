import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalProps, Prompt } from '@proton/components';

interface Props extends ModalProps {
    isMessage: boolean;
    onResolve: () => void;
    onReject: () => void;
    onCloseCustomAction?: () => void;
}

const MoveSnoozedModal = ({ isMessage, onResolve, onReject, onCloseCustomAction, ...rest }: Props) => {
    const handleClose = () => {
        onCloseCustomAction?.();
        onReject();
    };

    return (
        <Prompt
            title={c('Title').t`Moving a snoozed message`}
            buttons={[
                <Button color="norm" onClick={onResolve} data-testid="moveSnoozedConvesation">{c('Action')
                    .t`OK`}</Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info').t`Snoozing this conversation will be canceled.`}
        </Prompt>
    );
};
export default MoveSnoozedModal;
