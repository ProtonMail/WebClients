import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateHideEmbeddedImages } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

import Toggle from '../../components/toggle/Toggle';
import useApi from '../../hooks/useApi';
import useToggle from '../../hooks/useToggle';

interface Props {
    id: string;
}

const EmbeddedToggle = ({ id }: Props) => {
    const [mailSettings] = useMailSettings();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const dispatch = useDispatch();
    const { state, toggle } = useToggle(mailSettings.HideEmbeddedImages === SHOW_IMAGES.SHOW);

    const handleChange = async (checked: boolean) => {
        const bit = checked ? SHOW_IMAGES.SHOW : SHOW_IMAGES.HIDE;
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateHideEmbeddedImages(bit));
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

export default EmbeddedToggle;
