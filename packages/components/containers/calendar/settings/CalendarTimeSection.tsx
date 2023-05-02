import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import { SettingsSection } from '../../account';
import AutoDetectPrimaryTimezoneSection from './AutoDetectPrimaryTimezoneSection';
import PrimaryTimezoneSection from './PrimaryTimezoneSection';
import SecondaryTimezoneSection from './SecondaryTimezoneSection';
import ShowSecondaryTimezoneToggleSection from './ShowSecondaryTimezoneToggleSection';

interface Props {
    calendarUserSettings: CalendarUserSettings;
}

const CalendarTimeSection = ({ calendarUserSettings }: Props) => {
    return (
        <SettingsSection>
            <AutoDetectPrimaryTimezoneSection calendarUserSettings={calendarUserSettings} />
            <PrimaryTimezoneSection calendarUserSettings={calendarUserSettings} />
            <ShowSecondaryTimezoneToggleSection calendarUserSettings={calendarUserSettings} />
            <SecondaryTimezoneSection calendarUserSettings={calendarUserSettings} />
        </SettingsSection>
    );
};

export default CalendarTimeSection;
