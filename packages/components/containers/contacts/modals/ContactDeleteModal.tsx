import React from 'react';
import { c, msgid } from 'ttag';

import { clearContacts, deleteContacts } from 'proton-shared/lib/api/contacts';
import { allSucceded } from 'proton-shared/lib/api/helpers/response';
import { noop } from 'proton-shared/lib/helpers/function';

import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import useApi from '../../api/useApi';
import useNotifications from '../../notifications/useNotifications';
import useLoading from '../../../hooks/useLoading';
import useEventManager from '../../eventManager/useEventManager';
import ErrorButton from '../../../components/button/ErrorButton';
import Alert from '../../../components/alert/Alert';
import FormModal from '../../../components/modal/FormModal';
import useContacts from '../../../hooks/useContacts';

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
            onDelete && onDelete();
            await call();
            onClose();
            return createNotification({ text: c('Success').t`Contacts deleted` });
        }
        const apiSuccess = allSucceded(await api(deleteContacts(contactIDs)));
        onDelete && onDelete();
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
    const name = contact?.Name || contact?.Email || '';
    const title = c('Title').ngettext(msgid`Delete ${name}`, `Delete ${count} contacts`, count);

    return (
        <FormModal
            title={title}
            onSubmit={() => withLoadingDelete(handleDelete())}
            onClose={onClose}
            submit={submit}
            loading={loadingDelete}
            className="pm-modal--smaller"
            {...rest}
        >
            <Alert type="error">
                {c('Warning').ngettext(
                    msgid`Are you sure you want to permanently delete this contact?`,
                    `Are you sure you want to permanently delete these ${count} contacts?`,
                    count
                )}
            </Alert>
        </FormModal>
    );
};

export default DeleteModal;
