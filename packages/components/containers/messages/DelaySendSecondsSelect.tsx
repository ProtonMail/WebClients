import { useState } from 'react';
import { updateDelaySend } from '@proton/shared/lib/api/mailSettings';
import { c } from 'ttag';

import { useEventManager, useNotifications, useApi, useLoading } from '../../hooks';
import { Select } from '../../components';

interface Props {
    id: string;
    delaySendSeconds: number;
}

const DelaySendSecondsSelect = ({ id, delaySendSeconds }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const [delay, setDelay] = useState(delaySendSeconds);
    const options = [
        { text: c('Option delay send seconds').t`0 seconds`, value: 0 },
        { text: c('Option delay send seconds').t`5 seconds`, value: 5 },
        { text: c('Option delay send seconds').t`10 seconds`, value: 10 },
        { text: c('Option delay send seconds').t`20 seconds`, value: 20 },
    ];

    const handleChange = async (delay: number) => {
        await api(updateDelaySend(delay));
        await call();
        setDelay(delay);
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Select
            id={id}
            value={delay}
            options={options}
            onChange={({ target }) => withLoading(handleChange(+target.value))}
            loading={loading}
        />
    );
};

export default DelaySendSecondsSelect;
