import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components';
import { Alert, ErrorButton, Prompt } from '@proton/components';

interface Props extends ModalProps {
    onDeleteDraft: () => void;
}

const DeleteQuickReplyModal = ({ onDeleteDraft, ...rest }: Props) => {
    const { onClose } = rest;

    const handleDelete = () => {
        onDeleteDraft();
        onClose?.();
    };

    return (
        <Prompt
            title={c('Title').t`Delete draft`}
            buttons={[
                <ErrorButton onClick={handleDelete}>{c('Action').t`Delete`}</ErrorButton>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <Alert className="mb-4" type="error">{c('Info')
                .t`Are you sure you want to permanently delete this draft?`}</Alert>
        </Prompt>
    );
};

export default DeleteQuickReplyModal;
