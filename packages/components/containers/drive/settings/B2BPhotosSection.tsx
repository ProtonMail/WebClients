import { c } from 'ttag';

import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    useDriveB2BPhotosEnabledSetting,
} from '@proton/components';
import Toggle from '@proton/components/components/toggle/Toggle';

export const B2BPhotosSection = () => {
    const { b2bPhotosEnabled, isLoading, isSubmitting, handleChange } = useDriveB2BPhotosEnabledSetting();

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="photos-toggle">
                    <span className="mr-2">{c('Setting').t`Enable Photos section`}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle
                    id="photos-toggle"
                    disabled={isLoading}
                    checked={b2bPhotosEnabled}
                    loading={isSubmitting}
                    onChange={({ target }) => {
                        void handleChange(target.checked);
                    }}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
