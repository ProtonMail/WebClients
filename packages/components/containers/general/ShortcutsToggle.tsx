import { ChangeEvent } from 'react';

import { c } from 'ttag';

import { updateShortcuts } from '@proton/shared/lib/api/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { Toggle } from '../../components';
import { useApiWithoutResult, useEventManager, useMailSettings, useNotifications, useToggle } from '../../hooks';

interface Props {
    id: string;
    className?: string;
}

const ShortcutsToggle = ({ id, className, ...rest }: Props) => {
    const { call } = useEventManager();
    const [{ Shortcuts } = DEFAULT_MAILSETTINGS] = useMailSettings();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updateShortcuts);
    const { state, toggle } = useToggle(!!Shortcuts);

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await request(+target.checked);
        call();
        toggle();
        createNotification({ text: c('Success').t`Keyboard shortcuts preferences updated` });
    };

    return <Toggle id={id} className={className} checked={state} onChange={handleChange} loading={loading} {...rest} />;
};

export default ShortcutsToggle;
