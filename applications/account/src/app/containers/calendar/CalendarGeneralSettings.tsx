import { c } from 'ttag';

import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { SettingsPropsShared, ThemesSection, CalendarTimeSection, CalendarLayoutSection } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../content/PrivateMainSettingsAreaWithPermissions';

const generalSettingsConfig = {
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
        {
            text: c('Title').t`Theme`,
            id: 'theme',
        },
    ],
};

interface Props extends SettingsPropsShared {
    calendarUserSettings: CalendarUserSettings;
}

const CalendarGeneralSettings = ({ calendarUserSettings, location }: Props) => {
    return (
        <PrivateMainSettingsAreaWithPermissions config={generalSettingsConfig} location={location}>
            <CalendarTimeSection calendarUserSettings={calendarUserSettings} />
            <CalendarLayoutSection calendarUserSettings={calendarUserSettings} />
            <ThemesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default CalendarGeneralSettings;
