import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { useDocsNotificationsSettings } from '@proton/components/hooks/docs/useDocsNotificationsSettings';

export const CommentEmailSection = () => {
    const {
        emailNotificationsEnabled,
        emailTitleEnabled,
        isLoading,
        isSubmitting,
        changeDocumentTitleEnabledValue,
        changeEmailNotificationsEnabledValue,
    } = useDocsNotificationsSettings();

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="emails-enabled-toggle">
                        <span className="mr-2">{c('Setting').t`Get updates about comments via email`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="emails-enabled-toggle"
                        disabled={isLoading}
                        checked={emailNotificationsEnabled ?? false}
                        loading={isSubmitting}
                        onChange={({ target }) => {
                            void changeEmailNotificationsEnabledValue(target.checked);
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="document-name-toggle">
                        <span className="mr-2">{c('Setting').t`Include document name in email notifications`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="document-name-toggle"
                        disabled={isLoading}
                        checked={emailTitleEnabled ?? false}
                        loading={isSubmitting}
                        onChange={({ target }) => {
                            void changeDocumentTitleEnabledValue(target.checked);
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};
