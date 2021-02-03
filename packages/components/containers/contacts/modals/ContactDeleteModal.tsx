import React from 'react';
import { c, msgid } from 'ttag';

import { clearContacts, deleteContacts } from 'proton-shared/lib/api/contacts';
import { allSucceded } from 'proton-shared/lib/api/helpers/response';
import { noop } from 'proton-shared/lib/helpers/function';

import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { useContacts, useApi, useNotifications, useLoading, useEventManager } from '../../../hooks';
import { ErrorButton, Alert, FormModal } from '../../../components';

interface Props {
    contactIDs: string[];
    deleteAll?: boolean;
    onDelete?: () => void;
    onClose?: () => void;
}

const DeleteModal = ({ contactIDs = [], deleteAll, onDelete, onClose = noop, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [loadingDelete, withLoadingDelete] = useLoading();
    const [contacts = []] = useContacts();

    const submit = <ErrorButton type="submit" loading={loadingDelete}>{c('Action').t`Delete`}</ErrorButton>;

    const handleDelete = async () => {
        if (deleteAll) {
            await api(clearContacts());
            onDelete?.();
            await call();
            onClose();
            return createNotification({ text: c('Success').t`Contacts deleted` });
        }
        const apiSuccess = allSucceded(await api(deleteContacts(contactIDs)));
        onDelete?.();
        await call();
        onClose();
        if (!apiSuccess) {
            return createNotification({ text: c('Error').t`Some contacts could not be deleted`, type: 'warning' });
        }
        createNotification({
            text: c('Success').ngettext(msgid`Contact deleted`, `Contacts deleted`, contactIDs.length),
        });
    };

    const count = contactIDs.length;
    const contact = contacts.find((contact: ContactEmail) => contact.ID === contactIDs[0]);
    const Name = contact?.Name || contact?.Email || '';
    const title =
        count === 1
            ? c('Title').t`Delete ${Name}`
            : c('Title').ngettext(msgid`Delete ${count} contact`, `Delete ${count} contacts`, count);

    const text =
        count === 1
            ? c('Warning').t`Are you sure you want to permanently delete this contact?`
            : c('Warning').ngettext(
                  msgid`Are you sure you want to permanently delete ${count} contact?`,
                  `Are you sure you want to permanently delete ${count} contacts?`,
                  count
              );

    return (
        <FormModal
            title={title}
            onSubmit={() => withLoadingDelete(handleDelete())}
            onClose={onClose}
            submit={submit}
            loading={loadingDelete}
            className="modal--smaller"
            {...rest}
        >
            <Alert type="error">{text}</Alert>
        </FormModal>
    );
};

export default DeleteModal;
