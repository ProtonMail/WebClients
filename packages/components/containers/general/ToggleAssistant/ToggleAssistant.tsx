import { c } from 'ttag';

import { userSettingsActions } from '@proton/account';
import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

interface Props {
    id: string;
    aiFlag: AI_ASSISTANT_ACCESS;
    onDisableSetting?: () => void;
}

const { OFF, SERVER_ONLY, CLIENT_ONLY } = AI_ASSISTANT_ACCESS;

const ToggleAssistant = ({ id, aiFlag, onDisableSetting }: Props) => {
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const enabled = aiFlag === SERVER_ONLY || aiFlag === CLIENT_ONLY;
    const { state, toggle } = useToggle(enabled);

    const handleChange = async (value: AI_ASSISTANT_ACCESS) => {
        dispatch(userSettingsActions.update({ UserSettings: { AIAssistantFlags: value } }));
        await api(updateAIAssistant(value));
        toggle();

        if (value === OFF) {
            createNotification({ text: c('Success').t`Writing assistant disabled` });
        } else {
            createNotification({ text: c('Success').t`Writing assistant enabled` });
        }
    };

    const handleToggleSetting = () => {
        void withLoading(handleChange(enabled ? OFF : SERVER_ONLY));
        if (enabled) {
            onDisableSetting?.();
        }
    };

    return <Toggle id={id} checked={state} onChange={handleToggleSetting} loading={loading} />;
};

export default ToggleAssistant;
