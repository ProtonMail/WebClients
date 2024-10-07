import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { useDriveB2BPhotosEnabledSetting } from '@proton/components/hooks/drive/useDriveB2BPhotosEnabledSetting';

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
