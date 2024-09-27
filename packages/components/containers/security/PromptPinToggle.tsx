import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useLoading from '@proton/hooks/useLoading';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { useApi, useEventManager, useNotifications } from '../../hooks';

interface Props {
    id?: string;
}

const PromptPinToggle = ({ id }: Props) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [{ PromptPin } = DEFAULT_MAILSETTINGS] = useMailSettings();

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await api(updatePromptPin(+target.checked));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return <Toggle id={id} loading={loading} checked={!!PromptPin} onChange={(e) => withLoading(handleChange(e))} />;
};

export default PromptPinToggle;
