import { c } from 'ttag';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSectionWide from '../account/SettingsSectionWide';
import CrashReportsToggle from './CrashReportsToggle';
import DataCollectionDescription from './DataCollectionDescription';
import TelemetryToggle from './TelemetryToggle';

const PrivacySection = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                <DataCollectionDescription />
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="telemetry" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Collect anonymous usage diagnostics`}</span>
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
