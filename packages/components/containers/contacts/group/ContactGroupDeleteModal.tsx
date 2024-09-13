import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';
import { allSucceded } from '@proton/shared/lib/api/helpers/response';
import { deleteLabels } from '@proton/shared/lib/api/labels';
import type { ContactGroup } from '@proton/shared/lib/interfaces/contacts';

import type { ModalProps } from '../../../components';
import { useApi, useContactGroups, useEventManager, useNotifications } from '../../../hooks';
import { getDeleteText } from '../../general/helper';

export interface ContactGroupDeleteProps {
    groupIDs: string[];
    onDelete?: () => void;
    onClose?: () => void;
}

type Props = ContactGroupDeleteProps & ModalProps;

const ContactGroupDeleteModal = ({ groupIDs = [], onDelete, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [groups = []] = useContactGroups();

    const handleDelete = async () => {
        const apiSuccess = allSucceded(await api(deleteLabels(groupIDs)));
        await call();
        onDelete?.();
        rest.onClose?.();
        if (!apiSuccess) {
            return createNotification({ text: c('Error').t`Some groups could not be deleted`, type: 'warning' });
        }
        createNotification({
            text: c('Success').ngettext(msgid`Contact group deleted`, `Contact groups deleted`, groupIDs.length),
        });
    };

    const count = groupIDs.length;
    const { Name = '' } = groups.find((group: ContactGroup) => group.ID === groupIDs[0]) || {};
    const title =
        count === 1
            ? getDeleteText(Name)
            : // translator: the variable is a positive integer (written in digits) always strictly bigger than 1
              c('Title').ngettext(msgid`Delete ${count} contact group`, `Delete ${count} contact groups`, count);

    let alertText = c('Warning').t`Are you sure you want to permanently delete this contact group?`;
    if (count > 1) {
        alertText = c('Warning').t`Are you sure you want to permanently delete these contact groups?`;
    }

    let infoMessage = c('Info').t`Please note that addresses assigned to this group will NOT be deleted.`;
    if (count > 1) {
        infoMessage = c('Info').t`Please note that addresses assigned to these groups will NOT be deleted.`;
    }

    return (
        <Prompt
            title={title}
            buttons={[
                <Button
                    color="danger"
                    data-testid="delete-button"
                    onClick={() => withLoading(handleDelete())}
                    loading={loading}
                >
                    {c('Action').t`Delete`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <Alert className="mb-4" type="info">
                {infoMessage}
            </Alert>
            <Alert className="mb-4" type="error">
                {alertText}
            </Alert>
        </Prompt>
    );
};

export default ContactGroupDeleteModal;
