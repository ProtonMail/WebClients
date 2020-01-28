import React from 'react';
import { c } from 'ttag';
import { Button, useModals, ConfirmModal, Alert } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import { formatSimpleDate } from '../../helpers/date';
import { MessageExtended } from '../../models/message';
import { getDate } from '../../helpers/elements';
import AttachmentsButton from './attachments/AttachmentsButton';
import { useSlowChanges } from '../../hooks/useSlowChanges';

interface Props {
    message: MessageExtended;
    lock: boolean;
    activity: string;
    onAddAttachments: (files: File[]) => void;
    onSave: () => Promise<void>;
    onSend: () => Promise<void>;
    onDelete: () => Promise<void>;
}

const ComposerActions = ({
    message,
    lock,
    activity: activityInput,
    onSave,
    onSend,
    onDelete,
    onAddAttachments
}: Props) => {
    const { createModal } = useModals();
    const activity = useSlowChanges(activityInput);

    const handleDelete = () => {
        return createModal(
            <ConfirmModal onConfirm={onDelete} onClose={noop} title={c('Title').t`Delete`}>
                <Alert>{c('Info').t`Permanently delete this draft?`}</Alert>
            </ConfirmModal>
        );
    };

    let dateMessage = '';

    if (lock) {
        dateMessage = c('Action').t`Saving`;
    } else {
        const date = getDate(message.data);
        if (date.getTime() !== 0) {
            const dateString = formatSimpleDate(date);
            dateMessage = c('Info').t`Saved at ${dateString}`;
        }
    }

    return (
        <footer className="composer-actions flex flex-row flex-spacebetween w100">
            <div className="flex">
                <AttachmentsButton onAddAttachments={onAddAttachments} />
                <Button icon="expiration" className="ml0-5" />
                <Button icon="lock" className="ml0-5" />
            </div>
            <div className="flex-self-vcenter">
                <span>{dateMessage}</span>
                <Button className="ml1" icon="trash" disabled={lock} onClick={handleDelete} />{' '}
                <Button icon="save" disabled={lock} onClick={onSave} />{' '}
                <Button className="pm-button-blue composer-send-button" loading={lock} onClick={onSend}>
                    {lock ? activity : c('Action').t`Send`}
                </Button>
            </div>
        </footer>
    );
};

export default ComposerActions;
