import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components';
import { ErrorButton, Prompt } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

interface Props extends ModalProps {
    onResolve: () => void;
    onReject: () => void;
    destinationLabelID: string;
}

const MoveAllModal = ({ onResolve, onReject, destinationLabelID, ...rest }: Props) => {
    const getTitle = (destinationLabelID: string) => {
        switch (destinationLabelID) {
            case MAILBOX_LABEL_IDS.TRASH:
                return c('Title').t`Move all messages to trash`;
            case MAILBOX_LABEL_IDS.ARCHIVE:
                return c('Title').t`Move all messages to archive`;
            default:
                return '';
        }
    };

    const getContent = (destinationLabelID: string) => {
        switch (destinationLabelID) {
            case MAILBOX_LABEL_IDS.TRASH:
                return c('Info').t`Are you sure you want to move all messages in this location to trash?`;
            case MAILBOX_LABEL_IDS.ARCHIVE:
                return c('Info').t`Are you sure you want to move all messages in this location to archive?`;
            default:
                return '';
        }
    };

    const handleClose = () => {
        onReject();
    };

    const handleSubmit = () => {
        onResolve();
        rest.onClose?.();
    };

    return (
        <Prompt
            title={getTitle(destinationLabelID)}
            buttons={[
                <ErrorButton data-testid="confirm-empty-folder" onClick={handleSubmit}>
                    {c('Action').t`Move`}
                </ErrorButton>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {getContent(destinationLabelID)}
        </Prompt>
    );
};

export default MoveAllModal;
