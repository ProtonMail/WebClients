import { useState } from 'react';

import { c } from 'ttag';

import Select from '@proton/components/components/select/Select';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateImageProxy } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id: string;
    defaultProtectionMode: number;
}

const ProtectionModeSelect = ({ id, defaultProtectionMode, ...rest }: Props) => {
    const [protectionMode, setProtectionMode] = useState(defaultProtectionMode);

    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const dispatch = useDispatch();

    const options = [
        { text: c('Option protection mode').t`Load content via proxy (recommended)`, value: IMAGE_PROXY_FLAGS.PROXY },
        {
            text: c('Option protection mode').t`Load content via proxy and store as attachments`,
            value: IMAGE_PROXY_FLAGS.ALL,
        },
    ];

    const handleChange = async (protectionMode: number) => {
        let response: { MailSettings: MailSettings };

        if (protectionMode === IMAGE_PROXY_FLAGS.PROXY) {
            response = await api<{ MailSettings: MailSettings }>(
                updateImageProxy(IMAGE_PROXY_FLAGS.INCORPORATOR, 'remove')
            );
        } else {
            response = await api<{ MailSettings: MailSettings }>(
                updateImageProxy(IMAGE_PROXY_FLAGS.INCORPORATOR, 'add')
            );
        }
        dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));
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
