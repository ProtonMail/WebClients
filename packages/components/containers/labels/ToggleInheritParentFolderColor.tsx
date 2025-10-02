import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { updateInheritParentFolderColor } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

interface Props {
    id?: string;
    className?: string;
}

const ToggleInheritParentFolderColor = ({ id, className }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [mailSettings] = useMailSettings();
    const dispatch = useDispatch();

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(
            updateInheritParentFolderColor(+target.checked)
        );
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({
            text: c('label/folder notification').t`Preference saved`,
        });
    };

    return (
        <Toggle
            id={id}
            checked={!!mailSettings.InheritParentFolderColor}
            className={className}
            onChange={(e) => withLoading(handleChange(e))}
            loading={loading}
        />
    );
};

export default ToggleInheritParentFolderColor;
