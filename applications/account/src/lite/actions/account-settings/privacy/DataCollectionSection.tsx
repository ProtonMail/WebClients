import { c } from 'ttag';

import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import CrashReportsToggle from '@proton/components/containers/privacy/CrashReportsToggle';
import TelemetryToggle from '@proton/components/containers/privacy/TelemetryToggle';

const DataCollectionSection = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`To continuously improve our services, we sometimes collect data to monitor the proper functioning of our applications. This information is not shared with any 3rd-party services.`}
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
                                {c('Label').t`Collect usage diagnostics`}
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
