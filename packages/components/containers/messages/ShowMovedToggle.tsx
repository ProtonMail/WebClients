import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateShowMoved } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

const { DRAFTS_AND_SENT, NONE } = SHOW_MOVED;

interface Props {
    id: string;
}

const ShowMovedToggle = ({ id }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();
    const dispatch = useDispatch();
    const [mailSettings] = useMailSettings();
    const { state, toggle } = useToggle(!!mailSettings.ShowMoved);

    const handleChange = async (checked: boolean) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(
            updateShowMoved(checked ? DRAFTS_AND_SENT : NONE)
        );
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
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
