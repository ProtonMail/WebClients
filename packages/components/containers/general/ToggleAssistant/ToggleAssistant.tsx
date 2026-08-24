import { c } from 'ttag';

import { userSettingsActions } from '@proton/account';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateAIAssistant } from '@proton/shared/lib/api/settings';
import { AI_ASSISTANT_ACCESS, type UserSettings } from '@proton/shared/lib/interfaces';

import Toggle from '../../../components/toggle/Toggle';
import useToggle from '../../../hooks/useToggle';

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
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(updateAIAssistant(value));
        dispatch(userSettingsActions.set({ UserSettings }));
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
