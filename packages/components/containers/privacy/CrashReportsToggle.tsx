import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateCrashReports } from '@proton/shared/lib/api/settings';
import { setSentryEnabled } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { Toggle } from '../../components';
import { useApi, useEventManager, useNotifications, useUserSettings } from '../../hooks';

interface Props {
    id?: string;
}

const CrashReportsToggle = ({ id }: Props) => {
    const [userSettings] = useUserSettings();
    const [loadingCrashReports, withLoadingCrashReports] = useLoading();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });
    const crashReportsEnabled = !!userSettings?.CrashReports;
    return (
        <Toggle
            id={id}
            checked={crashReportsEnabled}
            onChange={({ target }) => {
                const handleChange = async (value: boolean) => {
                    await api(updateCrashReports({ CrashReports: Number(value) }));
                    await call();
                    setSentryEnabled(value);
                    notifyPreferenceSaved();
                };
                void withLoadingCrashReports(handleChange(target.checked)).catch(noop);
            }}
            loading={loadingCrashReports}
        />
    );
};

export default CrashReportsToggle;
