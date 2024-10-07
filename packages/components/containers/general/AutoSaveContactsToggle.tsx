import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useLoading } from '@proton/hooks';
import { updateAutoSaveContacts } from '@proton/shared/lib/api/mailSettings';

import { useNotifications } from '../../hooks';

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

    const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
