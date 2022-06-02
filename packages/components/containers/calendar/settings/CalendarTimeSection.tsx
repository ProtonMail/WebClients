import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import { SettingsSection } from '../../account';

import PrimaryTimezoneSection from './PrimaryTimezoneSection';
import ShowSecondaryTimezoneToggle from './ShowSecondaryTimezoneToggle';
import SecondaryTimezoneSection from './SecondaryTimezoneSection';
import AutoDetectPrimaryTimezoneSection from './AutoDetectPrimaryTimezoneSection';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const CalendarTimeSection = ({ calendarUserSettings }: Props) => {
    return (
        <SettingsSection>
            <AutoDetectPrimaryTimezoneSection calendarUserSettings={calendarUserSettings} />
            <PrimaryTimezoneSection calendarUserSettings={calendarUserSettings} />
            <ShowSecondaryTimezoneToggle calendarUserSettings={calendarUserSettings} />
            <SecondaryTimezoneSection calendarUserSettings={calendarUserSettings} />
        </SettingsSection>
    );
};

export default CalendarTimeSection;
