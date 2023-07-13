import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateShowMoved } from '@proton/shared/lib/api/mailSettings';
import { SHOW_MOVED } from '@proton/shared/lib/constants';

import { Toggle } from '../../components';
import { useApi, useEventManager, useMailSettings, useNotifications, useToggle } from '../../hooks';

const { DRAFTS_AND_SENT, NONE } = SHOW_MOVED;

interface Props {
    id: string;
}

const ShowMovedToggle = ({ id }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [{ ShowMoved = 0 } = {}] = useMailSettings();
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
