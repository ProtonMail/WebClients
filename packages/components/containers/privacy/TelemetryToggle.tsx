import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateTelemetry } from '@proton/shared/lib/api/settings';
import { setSentryEnabled } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { Toggle } from '../../components';
import { useApi, useEventManager, useNotifications, useUserSettings } from '../../hooks';

interface Props {
    id?: string;
}

const TelemetryToggle = ({ id }: Props) => {
    const [userSettings] = useUserSettings();
    const [loadingTelemetry, withLoadingTelemetry] = useLoading();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });
    const TelemetryEnabled = !!userSettings?.Telemetry;
    return (
        <Toggle
            id={id}
            checked={TelemetryEnabled}
            onChange={({ target }) => {
                const handleChange = async (value: boolean) => {
                    await api(updateTelemetry({ Telemetry: Number(value) }));
                    await call();
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
