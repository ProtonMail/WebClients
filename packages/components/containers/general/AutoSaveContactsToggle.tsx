import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store';
import { updateAutoSaveContacts } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

interface Props {
    autoSaveContacts: boolean;
    id?: string;
    className?: string;
}

const AutoSaveContactsToggle = ({ autoSaveContacts, id, className }: Props) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(
            updateAutoSaveContacts(+event.target.checked)
        );
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle
            id={id}
            className={className}
            loading={loading}
            checked={autoSaveContacts}
            onChange={(event) => withLoading(handleChange(event))}
        />
    );
};

export default AutoSaveContactsToggle;
