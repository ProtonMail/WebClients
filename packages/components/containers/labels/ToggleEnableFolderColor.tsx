import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { updateEnableFolderColor } from '@proton/shared/lib/api/mailSettings';

import { Toggle } from '../../components';
import { useApi, useLoading, useEventManager, useNotifications, useMailSettings } from '../../hooks';

interface Props {
    id?: string;
    className?: string;
}

const ToggleEnableFolderColor = ({ id, className }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [mailSettings] = useMailSettings();

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await api(updateEnableFolderColor(+target.checked));
        await call();
        createNotification({
            text: c('label/folder notification').t`Preference saved`,
        });
    };

    return (
        <Toggle
            id={id}
            checked={!!mailSettings?.EnableFolderColor}
            className={className}
            onChange={(e) => withLoading(handleChange(e))}
            loading={loading}
        />
    );
};

export default ToggleEnableFolderColor;
