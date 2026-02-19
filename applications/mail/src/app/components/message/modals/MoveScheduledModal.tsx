import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { Prompt } from '@proton/components';

export interface MoveScheduledModalProps {
    isMessage: boolean;
    onCloseCustomAction?: () => void;
}

interface Props extends MoveScheduledModalProps, ModalProps {
    onResolve: () => void;
    onReject: () => void;
}

const MoveScheduledModal = ({ isMessage, onResolve, onReject, onCloseCustomAction, ...rest }: Props) => {
    const handleClose = () => {
        onCloseCustomAction?.();
        onReject();
    };

    return (
        <Prompt
            title={c('Title').t`Moving a scheduled message`}
            buttons={[
                <Button color="norm" onClick={onResolve} data-testid="moveScheduledMessage">{c('Action')
                    .t`OK`}</Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {isMessage
                ? c('Info').t`Moving this message will cancel its scheduled send.`
                : c('Info')
                      .t`This conversation contains a scheduled message. Moving it will cancel the scheduled send.`}
        </Prompt>
    );
};
export default MoveScheduledModal;
