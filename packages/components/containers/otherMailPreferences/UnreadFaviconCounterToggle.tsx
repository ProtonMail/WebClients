import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateDisplayUnreadFavicon } from '@proton/shared/lib/api/mailSettings';

import { Toggle } from '../../components';
import { useApi, useEventManager, useMailSettings, useNotifications, useToggle } from '../../hooks';

interface Props {
    id?: string;
    className?: string;
}

export const UnreadFaviconCounterToggle = ({ id, className }: Props) => {
    const [mailSettings] = useMailSettings();
    const { call } = useEventManager();
    const api = useApi();

    const { state, toggle } = useToggle(!!mailSettings?.UnreadFavicon);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleChange = async (checked: boolean) => {
        await api(updateDisplayUnreadFavicon(+checked));
        await call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle
            id={id}
            className={className}
            checked={state}
            onChange={({ target }) => withLoading(handleChange(target.checked))}
            loading={loading}
        />
    );
};
