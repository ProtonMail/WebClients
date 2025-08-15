import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateTelemetry } from '@proton/shared/lib/api/settings';
import { setSentryEnabled } from '@proton/shared/lib/helpers/sentry';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

interface Props {
    id?: string;
}

const TelemetryToggle = ({ id }: Props) => {
    const [userSettings] = useUserSettings();
    const [loadingTelemetry, withLoadingTelemetry] = useLoading();
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });
    const TelemetryEnabled = !!userSettings?.Telemetry;
    return (
        <Toggle
            id={id}
            checked={TelemetryEnabled}
            onChange={({ target }) => {
                const handleChange = async (value: boolean) => {
                    const { UserSettings } = await api<{ UserSettings: UserSettings }>(
                        updateTelemetry({ Telemetry: Number(value) })
                    );
                    dispatch(userSettingsActions.update({ UserSettings }));
                    setSentryEnabled(value);
                    notifyPreferenceSaved();
                };
                void withLoadingTelemetry(handleChange(target.checked)).catch(noop);
            }}
            loading={loadingTelemetry}
        />
    );
};

export default TelemetryToggle;
