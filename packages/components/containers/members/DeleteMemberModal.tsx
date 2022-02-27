import { FormEvent, useState } from 'react';
import { c } from 'ttag';
import { Member } from '@proton/shared/lib/interfaces/Member';
import { removeDiacritics } from '@proton/shared/lib/helpers/string';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import {
    Alert,
    Card,
    ModalTwo,
    ModalTwoContent,
    InputFieldTwo,
    ModalTwoHeader,
    ModalTwoFooter,
    Button,
    ModalProps,
    useFormErrors,
} from '../../components';
import { useLoading } from '../../hooks';

const clean = (value: string) => {
    return removeDiacritics(value.toLowerCase().replace(/\s+/g, ''));
};

interface Props extends ModalProps<'form'> {
    member: Member;
    onDelete: (member: Member) => Promise<void>;
}

const DeleteMemberModal = ({ member, onDelete, ...rest }: Props) => {
    const [username, setUsername] = useState('');
    const isValid = clean(username) === clean(member.Name);
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();

    const handleClose = loading ? undefined : rest.onClose;

    return (
        <ModalTwo
            as="form"
            {...rest}
            onSubmit={async (event: FormEvent) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                await withLoading(onDelete(member));
                rest.onClose?.();
            }}
            onClose={handleClose}
        >
            <ModalTwoHeader title={c('Title').t`Delete user`} />
            <ModalTwoContent>
                <div className="mb1">
                    {c('Info')
                        .t`This will permanently delete the data and all email addresses associated with this user.`}
                </div>
                <Card rounded className="text-pre-wrap break user-select mb1">
                    {member.Name}
                </Card>
                <Alert className="mb1" type="error">{c('Info')
                    .t`To confirm, please enter the name of the user you wish to delete.`}</Alert>
                <InputFieldTwo
                    autoComplete="false"
                    value={username}
                    onValue={setUsername}
                    label={c('Label').t`Name`}
                    placeholder="Thomas A. Anderson"
                    error={validator([requiredValidator(username), !isValid ? c('Error').t`Name does not match` : ''])}
                    autoFocus
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button disabled={loading} onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" loading={loading} type="submit">{c('Action').t`Delete`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DeleteMemberModal;
