import React from 'react';
import { c } from 'ttag';
import { updateAutoSaveContacts } from 'proton-shared/lib/api/mailSettings';

import { useNotifications, useEventManager, useApi, useLoading } from '../../hooks';
import { Toggle } from '../../components';

interface Props {
    autoSaveContacts: boolean;
    id?: string;
    className?: string;
}

const AutoSaveContactsToggle = ({ autoSaveContacts, id, className }: Props) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        await api(updateAutoSaveContacts(+event.target.checked));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle
            id={id}
            className={className}
            loading={loading}
            checked={autoSaveContacts}
            onChange={(event) => withLoading(handleChange(event))}
        />
    );
};

export default AutoSaveContactsToggle;
