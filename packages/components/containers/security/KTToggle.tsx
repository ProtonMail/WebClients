import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/mailSettings';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { updateKT } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id?: string;
}

const KTToggle = ({ id }: Props) => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [{ KT } = DEFAULT_MAILSETTINGS] = useMailSettings();

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateKT(+target.checked));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return <Toggle id={id} loading={loading} checked={!!KT} onChange={(e) => withLoading(handleChange(e))} />;
};

export default KTToggle;
