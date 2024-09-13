import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import { useLoading } from '@proton/hooks';
import { clearContacts, deleteContacts } from '@proton/shared/lib/api/contacts';
import { allSucceded } from '@proton/shared/lib/api/helpers/response';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Contact } from '@proton/shared/lib/interfaces/contacts';

import type { ModalProps } from '../../../components';
import { ErrorButton, Prompt } from '../../../components';
import { useApi, useContacts, useEventManager, useNotifications } from '../../../hooks';
import { getDeleteText } from '../../general/helper';

export interface ContactDeleteProps {
    contactIDs: string[];
    deleteAll?: boolean;
    onDelete?: () => void;
}

type Props = ContactDeleteProps & ModalProps;

const ContactDeleteModal = ({ contactIDs = [], deleteAll, onDelete, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [loadingDelete, withLoadingDelete] = useLoading();
    const [contacts = []] = useContacts();

    const handleDelete = async () => {
        // Call the callback and close the modal and wait a bit to trigger the event manager
        // In order eventual contact view can be closed and will not try to request the contact
        const delayedClosing = async () => {
            onDelete?.();
            rest.onClose?.();
            await wait(1000);
            await call();
        };

        if (deleteAll) {
            await api(clearContacts());
            void delayedClosing();
            return createNotification({ text: c('Success').t`Contacts deleted` });
        }
        const apiSuccess = allSucceded(await api(deleteContacts(contactIDs)));
        void delayedClosing();
        if (!apiSuccess) {
            return createNotification({ text: c('Error').t`Some contacts could not be deleted`, type: 'warning' });
        }
        createNotification({
            text: c('Success').ngettext(msgid`Contact deleted`, `Contacts deleted`, contactIDs.length),
        });
    };

    const count = contactIDs.length;
    const contact = contacts.find((contact: Contact) => contact.ID === contactIDs[0]);
    const Name = contact?.Name || contact?.ContactEmails?.[0]?.Email || '';
    const title =
        count === 1
            ? getDeleteText(Name)
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
        <Prompt
            title={
                <div className="text-ellipsis" title={title}>
                    {title}
                </div>
            }
            buttons={[
                <ErrorButton
                    data-testid="delete-button"
                    onClick={() => withLoadingDelete(handleDelete())}
                    loading={loadingDelete}
                >{c('Action').t`Delete`}</ErrorButton>,
                <Button onClick={rest.onClose} autoFocus>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <Alert className="mb-4" type="error">
                {text}
            </Alert>
        </Prompt>
    );
};

export default ContactDeleteModal;
