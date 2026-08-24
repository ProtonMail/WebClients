import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateKT } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

import Toggle from '../../components/toggle/Toggle';

interface Props {
    id?: string;
}

const KTToggle = ({ id }: Props) => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [mailSettings] = useMailSettings();

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateKT(+target.checked));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle id={id} loading={loading} checked={!!mailSettings.KT} onChange={(e) => withLoading(handleChange(e))} />
    );
};

export default KTToggle;
