import React from 'react';
import { c, msgid } from 'ttag';

import { clearContacts, deleteContacts } from 'proton-shared/lib/api/contacts';
import { allSucceded } from 'proton-shared/lib/api/helpers/response';
import { noop } from 'proton-shared/lib/helpers/function';

import useApi from '../../api/useApi';
import useNotifications from '../../notifications/useNotifications';
import useLoading from '../../../hooks/useLoading';
import useEventManager from '../../eventManager/useEventManager';
import ErrorButton from '../../../components/button/ErrorButton';
import Alert from '../../../components/alert/Alert';
import FormModal from '../../../components/modal/FormModal';

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
    return (
        <FormModal
            title={c('Title').ngettext(msgid`Delete contact`, `Delete contacts`, contactIDs.length)}
            onSubmit={() => withLoadingDelete(handleDelete())}
            onClose={onClose}
            submit={submit}
            loading={loadingDelete}
            {...rest}
        >
            <Alert type="error">
                {c('Warning').ngettext(
                    msgid`This action will permanently delete the selected contact. Are you sure you want to delete this contact?`,
                    `This action will permanently delete selected contacts. Are you sure you want to delete these contacts?`,
                    contactIDs.length
                )}
            </Alert>
        </FormModal>
    );
};

export default DeleteModal;
