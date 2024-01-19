import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateShortcuts } from '@proton/shared/lib/api/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { Toggle } from '../../components';
import { useApi, useEventManager, useMailSettings, useNotifications, useToggle } from '../../hooks';

interface Props {
    id: string;
    className?: string;
}

const ShortcutsToggle = ({ id, className, ...rest }: Props) => {
    const { call } = useEventManager();
    const [{ Shortcuts } = DEFAULT_MAILSETTINGS] = useMailSettings();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { state, toggle } = useToggle(!!Shortcuts);

    const handleChange = async (value: number) => {
        await api(updateShortcuts(value));
        call();
        toggle();
        createNotification({ text: c('Success').t`Keyboard shortcuts preferences updated` });
    };

    return (
        <Toggle
            id={id}
            className={className}
            checked={state}
            onChange={({ target }) => {
                withLoading(handleChange(+target.checked));
            }}
            loading={loading}
            {...rest}
        />
    );
};

export default ShortcutsToggle;
