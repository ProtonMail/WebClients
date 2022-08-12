import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import { SettingsSection } from '../../account';
import AutoDetectPrimaryTimezoneSection from './AutoDetectPrimaryTimezoneSection';
import PrimaryTimezoneSection from './PrimaryTimezoneSection';
import SecondaryTimezoneSection from './SecondaryTimezoneSection';
import ShowSecondaryTimezoneToggle from './ShowSecondaryTimezoneToggle';

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
