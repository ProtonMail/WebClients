import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useApi, useEventManager, useNotifications, useToggle } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { updateDisplayUnreadFavicon } from '@proton/shared/lib/api/mailSettings';

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
