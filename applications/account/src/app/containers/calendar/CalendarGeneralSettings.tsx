import {
    CalendarLayoutSection,
    CalendarTimeSection,
    FeatureCode,
    SettingsPropsShared,
    ThemesSection,
    useFeature,
} from '@proton/components';
import CalendarInvitationsSection from '@proton/components/containers/calendar/settings/CalendarInvitationsSection';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { locales } from '@proton/shared/lib/i18n/locales';

import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { c } from 'ttag';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const generalSettingsConfig = (showInvitationsSettings: boolean) => ({
    to: '/calendar/general',
    icon: 'sliders',
    text: c('Link').t`General`,
    subsections: [
        {
            text: c('Title').t`Time zone`,
            id: 'time',
        },
        {
            text: c('Title').t`Layout`,
            id: 'layout',
        },
        showInvitationsSettings && {
            text: c('Title').t`Invitations`,
            id: 'invitations',
        },
        {
            text: c('Title').t`Theme`,
            id: 'theme',
        },
    ].filter(isTruthy),
});

interface Props extends SettingsPropsShared {
    calendarUserSettings: CalendarUserSettings;
}

const CalendarGeneralSettings = ({ calendarUserSettings, location }: Props) => {
    const showInvitationsSetting = !!useFeature(FeatureCode.CalendarInviteLocale).feature?.Value;

    return (
        <PrivateMainSettingsAreaWithPermissions
            config={generalSettingsConfig(showInvitationsSetting)}
            location={location}
        >
            <CalendarTimeSection calendarUserSettings={calendarUserSettings} />
            <CalendarLayoutSection calendarUserSettings={calendarUserSettings} />
            {showInvitationsSetting && (
                <CalendarInvitationsSection calendarUserSettings={calendarUserSettings} locales={locales} />
            )}
            <ThemesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default CalendarGeneralSettings;
