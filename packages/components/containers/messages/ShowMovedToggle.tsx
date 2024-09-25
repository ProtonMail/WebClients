import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { updateShowMoved } from '@proton/shared/lib/api/mailSettings';
import { DEFAULT_MAILSETTINGS, SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { useApi, useEventManager, useNotifications, useToggle } from '../../hooks';

const { DRAFTS_AND_SENT, NONE } = SHOW_MOVED;

interface Props {
    id: string;
}

const ShowMovedToggle = ({ id }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [{ ShowMoved } = DEFAULT_MAILSETTINGS] = useMailSettings();
    const { call } = useEventManager();
    const { state, toggle } = useToggle(!!ShowMoved);

    const handleChange = async (checked: boolean) => {
        await api(updateShowMoved(checked ? DRAFTS_AND_SENT : NONE));
        await call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => withLoading(handleChange(target.checked))}
            loading={loading}
        />
    );
};

export default ShowMovedToggle;
