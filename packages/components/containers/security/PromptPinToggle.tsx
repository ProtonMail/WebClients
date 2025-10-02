import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

interface Props {
    id?: string;
}

const PromptPinToggle = ({ id }: Props) => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [mailSettings] = useMailSettings();

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updatePromptPin(+target.checked));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle
            id={id}
            loading={loading}
            checked={!!mailSettings.PromptPin}
            onChange={(e) => withLoading(handleChange(e))}
        />
    );
};

export default PromptPinToggle;
