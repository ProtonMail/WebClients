import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { useDocsEmailNotificationsEnabled } from '@proton/components/hooks/docs/useDocsEmailNotificationsEnabled';

import { useDocsEmailTitleEnabledSetting } from '../../../hooks/docs/useDocsEmailTitleEnabledSetting';

export const CommentEmailSection = () => {
    const {
        emailTitleEnabled,
        isLoading: isEmailTitleLoading,
        isSubmitting: isEmailTitleSubmitting,
        handleChange: handleEmailTitleChange,
    } = useDocsEmailTitleEnabledSetting();
    const {
        emailNotificationsEnabled,
        isLoading: isEmailNotificationsLoading,
        isSubmitting: isEmailNotificationsSubmitting,
        handleChange: handleEmailNotificationsChange,
    } = useDocsEmailNotificationsEnabled();

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="emails-enabled-toggle">
                        <span className="mr-2">{c('Setting')
                            .t`Enable email notifications for comments and suggestions`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="emails-enabled-toggle"
                        disabled={isEmailNotificationsLoading}
                        checked={emailNotificationsEnabled}
                        loading={isEmailNotificationsSubmitting}
                        onChange={({ target }) => {
                            void handleEmailNotificationsChange(target.checked);
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="document-name-toggle">
                        <span className="mr-2">{c('Setting').t`Include document name in comment emails`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="document-name-toggle"
                        disabled={isEmailTitleLoading}
                        checked={emailTitleEnabled}
                        loading={isEmailTitleSubmitting}
                        onChange={({ target }) => {
                            void handleEmailTitleChange(target.checked);
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};
