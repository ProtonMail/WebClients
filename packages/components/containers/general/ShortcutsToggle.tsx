import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { updateShortcuts } from '@proton/shared/lib/api/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

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
