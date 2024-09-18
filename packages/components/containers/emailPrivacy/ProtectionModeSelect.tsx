import { useState } from 'react';

import { c } from 'ttag';

import Select from '@proton/components/components/select/Select';
import { useLoading } from '@proton/hooks';
import { updateImageProxy } from '@proton/shared/lib/api/mailSettings';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';

import { useApi, useEventManager, useNotifications } from '../../hooks';

interface Props {
    id: string;
    defaultProtectionMode: number;
}

const ProtectionModeSelect = ({ id, defaultProtectionMode, ...rest }: Props) => {
    const [protectionMode, setProtectionMode] = useState(defaultProtectionMode);

    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { call } = useEventManager();

    const options = [
        { text: c('Option protection mode').t`Load content via proxy (recommended)`, value: IMAGE_PROXY_FLAGS.PROXY },
        {
            text: c('Option protection mode').t`Load content via proxy and store as attachments`,
            value: IMAGE_PROXY_FLAGS.ALL,
        },
    ];

    const handleChange = async (protectionMode: number) => {
        if (protectionMode === IMAGE_PROXY_FLAGS.PROXY) {
            await api(updateImageProxy(IMAGE_PROXY_FLAGS.INCORPORATOR, 'remove'));
        } else {
            await api(updateImageProxy(IMAGE_PROXY_FLAGS.INCORPORATOR, 'add'));
        }
        await call();
        setProtectionMode(protectionMode);
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Select
            id={id}
            value={protectionMode}
            options={options}
            onChange={({ target }) => withLoading(handleChange(+target.value))}
            loading={loading}
            {...rest}
        />
    );
};

export default ProtectionModeSelect;
