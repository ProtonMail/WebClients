import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { updateShortcuts } from '@proton/shared/lib/api/mailSettings';

import { useToggle, useEventManager, useApiWithoutResult, useNotifications, useMailSettings } from '../../hooks';
import { Toggle } from '../../components';

interface Props {
    id: string;
    className?: string;
}

const ShortcutsToggle = ({ id, className }: Props) => {
    const { call } = useEventManager();
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updateShortcuts);
    const { state, toggle } = useToggle(!!Shortcuts);

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await request(+target.checked);
        call();
        toggle();
        createNotification({ text: c('Success').t`Keyboard shortcuts preferences updated` });
    };

    return <Toggle id={id} className={className} checked={state} onChange={handleChange} loading={loading} />;
};

export default ShortcutsToggle;
