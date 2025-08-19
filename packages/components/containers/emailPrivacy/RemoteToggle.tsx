import { useState } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { updateHideRemoteImages } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAILSETTINGS, SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id: string;
}

const RemoteToggle = ({ id, ...rest }: Props) => {
    const [{ HideRemoteImages } = DEFAULT_MAILSETTINGS] = useMailSettings();
    const [hideRemoteImages, setHideRemoteImages] = useState(HideRemoteImages);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();
    const dispatch = useDispatch();
    const { state, toggle } = useToggle(hideRemoteImages === SHOW_IMAGES.SHOW);

    const handleChange = async (checked: boolean) => {
        const bit = checked ? SHOW_IMAGES.SHOW : SHOW_IMAGES.HIDE;
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateHideRemoteImages(bit));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        toggle();
        setHideRemoteImages(bit);
        createNotification({ text: c('Success').t`Preference saved` });
    };
    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => withLoading(handleChange(target.checked))}
            loading={loading}
            {...rest}
        />
    );
};

export default RemoteToggle;
