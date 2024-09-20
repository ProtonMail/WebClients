import { c } from 'ttag';

import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';

import CrashReportsToggle from './CrashReportsToggle';
import TelemetryToggle from './TelemetryToggle';

const PrivacySection = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`To continuously improve our services, we sometimes collect data to monitor the proper functioning of our applications. This information is not shared with any 3rd-party services.`}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="telemetry" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Collect usage diagnostics`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <TelemetryToggle id="telemetry" />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="crashReports" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Send crash reports`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <CrashReportsToggle id="crashReports" />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSectionWide>
    );
};

export default PrivacySection;
