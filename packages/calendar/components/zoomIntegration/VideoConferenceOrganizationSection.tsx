import { c } from 'ttag';

import { SettingsParagraph, SettingsSection } from '@proton/components';

import { VideoConferenceToggle } from './VideoConferenceToggle';

export const VideoConferenceOrganizationSection = () => {
    return (
        <SettingsSection>
            <SettingsParagraph>{c('Label')
                .t`Allows everyone in your organization to seamlessly add video conferencing links to their calendar invitations.`}</SettingsParagraph>
            <VideoConferenceToggle />
        </SettingsSection>
    );
};
