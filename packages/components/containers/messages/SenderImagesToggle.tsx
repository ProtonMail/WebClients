import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { updateHideSenderImages } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

interface Props {
    id?: string;
    className?: string;
}

const SenderImagesToggle = ({ id, className }: Props) => {
    const [mailSettings] = useMailSettings();
    const { state, toggle } = useToggle(!mailSettings?.HideSenderImages);
    const { createNotification } = useNotifications();
    const api = useApi();
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();

    const handleChange = async (checked: boolean) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateHideSenderImages(+!checked));
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

export default SenderImagesToggle;
