import { c } from 'ttag';

import { Toggle } from '@proton/components/components';
import { useApi, useEventManager, useNotifications, useToggle, useUserSettings } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    id: string;
}

const ToggleAssistant = ({ id }: Props) => {
    const { call } = useEventManager();
    const [{ AIAssistantFlags }] = useUserSettings();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const enabled = AIAssistantFlags > AI_ASSISTANT_ACCESS.OFF || AIAssistantFlags === AI_ASSISTANT_ACCESS.UNSET;
    const { state, toggle } = useToggle(enabled);

    const handleChange = async (value: AI_ASSISTANT_ACCESS) => {
        await api(updateAIAssistant(value));
        void call();
        toggle();

        if (value === AI_ASSISTANT_ACCESS.SERVER_ONLY) {
            createNotification({ text: c('Success').t`Writing assistant enabled` });
        } else {
            createNotification({ text: c('Success').t`Writing assistant disabled` });
        }
    };

    return (
        <Toggle
            id={id}
            checked={state}
            onChange={() => {
                void withLoading(handleChange(enabled ? AI_ASSISTANT_ACCESS.OFF : AI_ASSISTANT_ACCESS.SERVER_ONLY));
            }}
            loading={loading}
        />
    );
};

export default ToggleAssistant;
