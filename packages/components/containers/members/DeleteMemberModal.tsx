import { useState } from 'react';
import { c } from 'ttag';
import { Member } from '@proton/shared/lib/interfaces/Member';
import { removeDiacritics } from '@proton/shared/lib/helpers/string';

import { Alert, Input, ErrorButton, DeleteModal, Card } from '../../components';

interface Props {
    member: Member;
    onConfirm: () => void;
    onClose: () => void;
}

const clean = (value: string) => {
    return removeDiacritics(value.toLowerCase().replace(/\s+/g, ''));
};

const DeleteMemberModal = ({ member, onConfirm, onClose, ...rest }: Props) => {
    const [username, setUsername] = useState('');
    const isValid = clean(username) === clean(member.Name);

    const handleSubmit = async () => {
        if (!isValid) {
            return;
        }
        onConfirm();
    };

    return (
        <DeleteModal
            title={c('Title').t`Delete user`}
            onConfirm={handleSubmit}
            onClose={onClose}
            confirm={<ErrorButton disabled={!isValid} type="submit">{c('Action').t`Delete`}</ErrorButton>}
            {...rest}
        >
            <div className="mb1">
                {c('Info').t`This will permanently delete the data and all email addresses associated with this user.`}
            </div>
            <Card rounded className="text-pre-wrap break user-select mb1">
                {member.Name}
            </Card>
            <Alert className="mb1" type="error">{c('Info')
                .t`To confirm, please enter the name of the user you wish to delete.`}</Alert>
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
