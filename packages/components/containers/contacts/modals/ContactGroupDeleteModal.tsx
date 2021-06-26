import React from 'react';
import { c, msgid } from 'ttag';

import { noop } from '@proton/shared/lib/helpers/function';
import { ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { deleteLabel } from '@proton/shared/lib/api/labels';

import { useApi, useContactGroups, useEventManager, useLoading, useNotifications } from '../../../hooks';
import { Alert, ErrorButton, FormModal } from '../../../components';

interface Props {
    groupIDs: string[];
    onDelete?: () => void;
    onClose?: () => void;
}

const ContactGroupDeleteModal = ({ groupIDs = [], onDelete, onClose = noop, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [groups = []] = useContactGroups();

    const submit = <ErrorButton type="submit" loading={loading}>{c('Action').t`Delete`}</ErrorButton>;

    const handleDelete = async () => {
        await Promise.all(groupIDs.map((groupID) => api(deleteLabel(groupID))));
        await call();
        onDelete?.();
        onClose();
        createNotification({
            text: c('Success').ngettext(msgid`Contact group deleted`, `Contact groups deleted`, groupIDs.length),
        });
    };

    const count = groupIDs.length;
    const { Name = '' } = groups.find((group: ContactGroup) => group.ID === groupIDs[0]) || {};
    const title =
        count === 1
            ? c('Title').t`Delete ${Name}`
            : // translator: the variable is a positive integer (written in digits) always strictly bigger than 1
              c('Title').ngettext(msgid`Delete ${count} contact group`, `Delete ${count} contact groups`, count);

    const alertText =
        count === 1
            ? c('Warning').t`Are you sure you want to permanently delete this contact group?`
            : // tranlator: the variable is a positive integer (written in digits) always greater than 1
              c('Warning').ngettext(
                  msgid`Are you sure you want to permanently delete ${count} contact group?`,
                  `Are you sure you want to permanently delete ${count} contact groups?`,
                  count
              );

    return (
        <FormModal
            title={title}
            onSubmit={() => withLoading(handleDelete())}
            onClose={onClose}
            submit={submit}
            loading={loading}
            className="modal--smaller"
            {...rest}
        >
            <Alert type="info">
                {c('Info').t`Please note that addresses assigned to this group will NOT be deleted.`}
            </Alert>
            <Alert type="error">{alertText}</Alert>
        </FormModal>
    );
};

export default ContactGroupDeleteModal;
