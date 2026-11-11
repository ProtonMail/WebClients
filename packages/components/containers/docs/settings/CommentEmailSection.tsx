import { c } from 'ttag';

import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';

import { useDocsNotificationsSettings } from '../../../hooks/docs/useDocsNotificationsSettings';
import { SettingsToggleRow } from '../../account/SettingsToggleRow';

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
        <DashboardGrid>
            <DashboardCard>
                <DashboardCardContent>
                    <SettingsToggleRow
                        id="emails-enabled-toggle"
                        label={
                            <SettingsToggleRow.Label>{c('Setting')
                                .t`Get updates about comments via email`}</SettingsToggleRow.Label>
                        }
                        toggle={
                            <SettingsToggleRow.Toggle
                                disabled={isLoading}
                                checked={emailNotificationsEnabled ?? false}
                                loading={isSubmitting}
                                onChange={({ target }) => {
                                    void changeEmailNotificationsEnabledValue(target.checked);
                                }}
                            />
                        }
                    />

                    <DashboardCardDivider />

                    <SettingsToggleRow
                        id="document-name-toggle"
                        label={
                            <SettingsToggleRow.Label>{c('Setting')
                                .t`Include document name in email notifications`}</SettingsToggleRow.Label>
                        }
                        toggle={
                            <SettingsToggleRow.Toggle
                                disabled={isLoading}
                                checked={emailTitleEnabled ?? false}
                                loading={isSubmitting}
                                onChange={({ target }) => {
                                    void changeDocumentTitleEnabledValue(target.checked);
                                }}
                            />
                        }
                    />
                </DashboardCardContent>
            </DashboardCard>
        </DashboardGrid>
    );
};
