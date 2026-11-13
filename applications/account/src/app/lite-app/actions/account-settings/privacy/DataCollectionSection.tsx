import { c } from 'ttag';

import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import CrashReportsToggle from '@proton/components/containers/privacy/CrashReportsToggle';
import DataCollectionDescription from '@proton/components/containers/privacy/DataCollectionDescription';
import TelemetryToggle from '@proton/components/containers/privacy/TelemetryToggle';

const DataCollectionSection = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                <DataCollectionDescription />
            </SettingsParagraph>
            <SettingsLayout>
                <InputFieldStackedGroup classname="w-full">
                    <InputFieldStacked
                        isGroupElement
                        style={{
                            '--stacked-field-padding-block': '1rem',
                        }}
                    >
                        <div className="flex items-center justify-space-between">
                            <label htmlFor="telemetry" className="text-semibold">
                                {c('Label').t`Collect anonymous usage diagnostics`}
                            </label>
                            <TelemetryToggle id="telemetry" />
                        </div>
                    </InputFieldStacked>
                    <InputFieldStacked
                        isGroupElement
                        style={{
                            '--stacked-field-padding-block': '1rem',
                        }}
                    >
                        <div className="flex items-center justify-space-between">
                            <label htmlFor="crashReports" className="text-semibold">
                                {c('Label').t`Send crash reports`}
                            </label>
                            <CrashReportsToggle id="crashReports" />
                        </div>
                    </InputFieldStacked>
                </InputFieldStackedGroup>
            </SettingsLayout>
        </SettingsSectionWide>
    );
};

export default DataCollectionSection;
