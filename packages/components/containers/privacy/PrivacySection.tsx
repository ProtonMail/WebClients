import React from 'react';
import { c } from 'ttag';
import { updateCrashReports, updateTelemetry } from '@proton/shared/lib/api/settings';
import noop from '@proton/utils/noop';
import { setSentryEnabled } from '@proton/shared/lib/helpers/sentry';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';

import { Toggle } from '../../components';
import { useApi, useEventManager, useLoading, useUserSettings } from '../../hooks';

import {
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsSectionWide,
    SettingsParagraph,
    SettingsLayout,
} from '../account';

const PrivacySection = () => {
    const [userSettings] = useUserSettings();
    const [loadingTelemetry, withLoadingTelemetry] = useLoading();
    const [loadingCrashReports, withLoadingCrashReports] = useLoading();
    const api = useApi();
    const { call } = useEventManager();

    const telemetryEnabled = !!userSettings?.Telemetry;
    const crashReportsEnabled = !!userSettings?.CrashReports;

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`To continuously improve our services, we sometimes collect data to monitor the proper functioning of our applications. This information is not shared with any 3rd-party services.`}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="telemetry" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Collect usage diagnostics`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <Toggle
                        id="telemetry"
                        checked={telemetryEnabled}
                        onChange={({ target }) => {
                            const handleChange = async (value: boolean) => {
                                await api(updateTelemetry({ Telemetry: Number(value) }));
                                await call();
                                setMetricsEnabled(value);
                            };
                            withLoadingTelemetry(handleChange(target.checked)).catch(noop);
                        }}
                        loading={loadingTelemetry}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="crashReports" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Send crash reports`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <Toggle
                        id="crashReports"
                        checked={crashReportsEnabled}
                        onChange={({ target }) => {
                            const handleChange = async (value: boolean) => {
                                await api(updateCrashReports({ CrashReports: Number(value) }));
                                await call();
                                setSentryEnabled(value);
                            };
                            withLoadingCrashReports(handleChange(target.checked)).catch(noop);
                        }}
                        loading={loadingCrashReports}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSectionWide>
    );
};

export default PrivacySection;
