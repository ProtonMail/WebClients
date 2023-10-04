import { ChangeEvent } from 'react';

import { c } from 'ttag';

import useLoading from '@proton/hooks/useLoading';
import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';

import { Toggle } from '../../components';
import { useApi, useEventManager, useMailSettings, useNotifications } from '../../hooks';

interface Props {
    id?: string;
}

const PromptPinToggle = ({ id }: Props) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [{ PromptPin = 0 } = {}] = useMailSettings();

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await api(updatePromptPin(+target.checked));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return <Toggle id={id} loading={loading} checked={!!PromptPin} onChange={(e) => withLoading(handleChange(e))} />;
};

export default PromptPinToggle;
