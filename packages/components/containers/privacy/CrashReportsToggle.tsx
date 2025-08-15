import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateCrashReports } from '@proton/shared/lib/api/settings';
import { setSentryEnabled } from '@proton/shared/lib/helpers/sentry';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

interface Props {
    id?: string;
}

const CrashReportsToggle = ({ id }: Props) => {
    const [userSettings] = useUserSettings();
    const dispatch = useDispatch();
    const [loadingCrashReports, withLoadingCrashReports] = useLoading();
    const api = useApi();
    const { createNotification } = useNotifications();
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });
    const crashReportsEnabled = !!userSettings?.CrashReports;
    return (
        <Toggle
            id={id}
            checked={crashReportsEnabled}
            onChange={({ target }) => {
                const handleChange = async (value: boolean) => {
                    const { UserSettings } = await api<{ UserSettings: UserSettings }>(
                        updateCrashReports({ CrashReports: Number(value) })
                    );
                    dispatch(userSettingsActions.update({ UserSettings }));
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
