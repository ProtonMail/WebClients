import { useState } from 'react';

import useUserCalendars from '@proton/activation/src/hooks/useUserCalendars';
import { ImporterCalendar } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useCalendars } from '@proton/components';
import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

export interface DerivedCalendarType {
    selectedCalendars: ImporterCalendar[];
    calendarsToBeCreatedCount: number;
    calendarLimitReached: boolean;
    selectedCalendarsCount: number;
    disabled: boolean;
    calendarToFixCount: number;
    canMerge: boolean;
    totalCalendarsCount: number;
    calendarsToBeMergedCount: number;
}

const useCustomizeCalendarImportModal = () => {
    const [calendars = []] = useCalendars();

    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const providerCalendars = importerData?.calendars?.calendars!;

    const [userActiveCalendars] = useUserCalendars();
    const [providerCalendarsState, setProviderCalendarsState] = useState<ImporterCalendar[]>(
        providerCalendars.map((calendar) => {
            return {
                ...calendar,
                newCalendar: !userActiveCalendars.some((cal) => cal.ID === calendar.id),
            };
        })
    );

    const handleCalendarToggle = (cal: ImporterCalendar) => {
        const updatedCalendar = providerCalendarsState.map((item) => {
            if (item.id === cal.id) {
                return { ...item, checked: !item.checked };
            }
            return item;
        });

        setProviderCalendarsState(updatedCalendar);
    };

    const handleMappingChange = (cal: ImporterCalendar, destinationCalendar?: VisualCalendar) => {
        const updatedCalendar = providerCalendarsState.map((item) => {
            if (item.id === cal.id) {
                return { ...item, mergedTo: destinationCalendar, newCalendar: !Boolean(destinationCalendar) };
            }
            return item;
        });

        setProviderCalendarsState(updatedCalendar);
    };

    const selectedCalendars = providerCalendarsState.filter((x) => x.checked);
    const calendarsToBeCreatedCount = selectedCalendars.filter((cal) => cal.newCalendar).length;
    const calendarLimitReached = calendarsToBeCreatedCount + calendars.length > MAX_CALENDARS_PAID;
    const selectedCalendarsCount = selectedCalendars.length;
    const disabled = calendarLimitReached || selectedCalendarsCount === 0;
    const calendarToFixCount = Math.abs(MAX_CALENDARS_PAID - calendars.length - calendarsToBeCreatedCount);
    const canMerge = userActiveCalendars.length > 0;
    const totalCalendarsCount = providerCalendarsState.length;
    const calendarsToBeMergedCount = providerCalendarsState.filter((cal) => !!cal.mergedTo).length;

    const derivedValues: DerivedCalendarType = {
        calendarsToBeCreatedCount,
        calendarsToBeMergedCount,
        selectedCalendarsCount,
        totalCalendarsCount,
        calendarToFixCount,
        calendarLimitReached,
        disabled,
        canMerge,
        selectedCalendars,
    };

    return {
        providerCalendars,
        derivedValues,
        providerCalendarsState,
        setProviderCalendarsState,
        activeWritableCalendars: userActiveCalendars,
        handleCalendarToggle,
        handleMappingChange,
    };
};
export default useCustomizeCalendarImportModal;
