import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import { Prompt } from '@proton/components/components';
import { useLoading } from '@proton/hooks';
import { NAME_PLACEHOLDER } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { removeDiacritics } from '@proton/shared/lib/helpers/string';
import { Member } from '@proton/shared/lib/interfaces/Member';

import {
    Alert,
    InputFieldTwo,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useFormErrors,
} from '../../components';
import { UserManagementMode } from './types';

const clean = (value: string) => {
    return removeDiacritics(value.toLowerCase().replace(/\s+/g, ''));
};

interface Props extends ModalProps<'form'> {
    member: Member;
    onDelete: (member: Member) => Promise<void>;
    mode: UserManagementMode;
}

const SubUserDeleteModal = ({ member, onDelete, mode, ...rest }: Props) => {
    const [username, setUsername] = useState('');
    const isValid = clean(username) === clean(member.Name);
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();

    const handleClose = loading ? undefined : rest.onClose;

    if (mode === UserManagementMode.VPN_B2B) {
        const handleDelete = async () => {
            await withLoading(onDelete(member));
            rest.onClose?.();
        };
        return (
            <Prompt
                title={c('Title').t`Delete user?`}
                open={rest.open}
                onClose={rest.onClose}
                buttons={[
                    <Button color="danger" loading={loading} onClick={handleDelete}>{c('Action')
                        .t`Delete user`}</Button>,
                    <Button disabled={loading} onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
                ]}
            >
                <p>{c('Info').t`They will be removed from your organization`}</p>
            </Prompt>
        );
    }

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
                <div className="mb-4">
                    {c('Info')
                        .t`This will permanently delete the data and all email addresses associated with this user.`}
                </div>
                <Card rounded className="text-pre-wrap break user-select mb-4">
                    {member.Name}
                </Card>
                <Alert className="mb-4" type="error">{c('Info')
                    .t`To confirm, please enter the name of the user you wish to delete.`}</Alert>
                <InputFieldTwo
                    autoComplete="false"
                    value={username}
                    onValue={setUsername}
                    label={c('Label').t`Name`}
                    placeholder={NAME_PLACEHOLDER}
                    error={validator([requiredValidator(username), !isValid ? c('Error').t`Name does not match` : ''])}
                    autoFocus
                    data-testid="deleteMemberModal:username-input"
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button disabled={loading} onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" loading={loading} type="submit">{c('Action').t`Delete`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SubUserDeleteModal;
