import React from 'react';
import { updateDelaySend } from 'proton-shared/lib/api/mailSettings';
import { c } from 'ttag';

import { useToggle, useEventManager, useNotifications, useApi, useLoading } from '../../hooks';
import { Toggle } from '../../components';

interface Props {
    id: string;
    delaySendSeconds: number;
}

const DelaySendSecondsToggle = ({ id, delaySendSeconds }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(!!delaySendSeconds);

    const handleChange = async (checked: boolean) => {
        await api(updateDelaySend(checked ? 5 : 0));
        await call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => withLoading(handleChange(target.checked))}
            loading={loading}
        />
    );
};

export default DelaySendSecondsToggle;
