import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import useLoading from '@proton/hooks/useLoading';
import { updateKT } from '@proton/shared/lib/api/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { Toggle } from '../../components';
import { useApi, useEventManager, useMailSettings, useNotifications } from '../../hooks';

interface Props {
    id?: string;
}

const KTToggle = ({ id }: Props) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [{ KT } = DEFAULT_MAILSETTINGS] = useMailSettings();

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await api(updateKT(+target.checked));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return <Toggle id={id} loading={loading} checked={!!KT} onChange={(e) => withLoading(handleChange(e))} />;
};

export default KTToggle;
