import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateDisplayUnreadFavicon } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

import Toggle from '../../components/toggle/Toggle';
import useToggle from '@proton/hooks/useToggle'

interface Props {
    id?: string;
    className?: string;
}

export const UnreadFaviconCounterToggle = ({ id, className }: Props) => {
    const [mailSettings] = useMailSettings();
    const api = useApi();
    const dispatch = useDispatch();
    const { state, toggle } = useToggle(!!mailSettings.UnreadFavicon);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleChange = async (checked: boolean) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateDisplayUnreadFavicon(+checked));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
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
