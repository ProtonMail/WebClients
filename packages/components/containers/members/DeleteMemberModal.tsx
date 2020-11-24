import React, { useState } from 'react';
import { c } from 'ttag';
import { Member } from 'proton-shared/lib/interfaces/Member';

import { Alert, Input, ErrorButton, DeleteModal } from '../../components';

interface Props {
    member: Member;
    onConfirm: () => void;
    onClose: () => void;
}

const DeleteMemberModal = ({ member, onConfirm, onClose, ...rest }: Props) => {
    const [username, setUsername] = useState('');
    const title = c('Title').t`Delete "${member.Name}"?`;
    const isValid = username === member.Name;

    const handleSubmit = async () => {
        if (!isValid) {
            return;
        }
        onConfirm();
    };

    return (
        <DeleteModal
            title={title}
            onConfirm={handleSubmit}
            onClose={onClose}
            confirm={<ErrorButton disabled={!isValid} type="submit">{c('Action').t`Delete`}</ErrorButton>}
            {...rest}
        >
            <Alert>{c('Info')
                .t`This will permanently delete the data and all email addresses associated with this user.`}</Alert>
            <Alert type="error">{c('Info').t`To confirm, please enter the name of the user you wish to delete.`}</Alert>
            <Input
                autoComplete="false"
                value={username}
                onChange={({ target }) => setUsername(target.value)}
                placeholder={c('Placeholder').t`Username`}
                autoFocus
            />
        </DeleteModal>
    );
};

export default DeleteMemberModal;
