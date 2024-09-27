import { useState } from 'react';

import type { ImporterCalendar } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { useUser } from '@proton/components';
import {
    getProbablyActiveCalendars,
    getVisualCalendars,
    getWritableCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { willUserReachCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

export interface DerivedCalendarType {
    selectedCalendars: ImporterCalendar[];
    calendarsToBeCreatedCount: number;
    calendarLimitReached: boolean;
    selectedCalendarsCount: number;
    disabled: boolean;
    calendarsToFixCount: number;
    canMerge: boolean;
    totalCalendarsCount: number;
    calendarsToBeMergedCount: number;
}

const useCustomizeCalendarImportModal = () => {
    const [calendars = []] = useCalendars();
    const [user] = useUser();

    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const providerCalendars = importerData?.calendars?.calendars!;

    const visualCalendars = getVisualCalendars(calendars);
    const activeWritableCalendars = getWritableCalendars(getProbablyActiveCalendars(visualCalendars));

    const [providerCalendarsState, setProviderCalendarsState] = useState<ImporterCalendar[]>(
        providerCalendars.map((calendar) => {
            return {
                ...calendar,
                newCalendar: !activeWritableCalendars.some(({ ID }) => ID === calendar.id),
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
    const calendarsToBeCreatedCount = selectedCalendars.filter(({ newCalendar }) => newCalendar).length;
    const calendarLimitReached = willUserReachCalendarsLimit(
        visualCalendars,
        calendarsToBeCreatedCount,
        !user.hasPaidMail
    );
    const selectedCalendarsCount = selectedCalendars.length;
    const disabled = calendarLimitReached || selectedCalendarsCount === 0;
    const canMerge = activeWritableCalendars.length > 0;
    const totalCalendarsCount = providerCalendarsState.length;
    const calendarsToBeMergedCount = providerCalendarsState.filter((cal) => !!cal.mergedTo).length;

    const maxCalendars = user.hasPaidMail ? MAX_CALENDARS_PAID : MAX_CALENDARS_FREE;
    const totalCalendars = calendarsToBeCreatedCount + visualCalendars.length;
    const calendarsToFixCount = totalCalendars - maxCalendars;

    const derivedValues: DerivedCalendarType = {
        calendarsToBeCreatedCount,
        calendarsToBeMergedCount,
        selectedCalendarsCount,
        totalCalendarsCount,
        calendarsToFixCount,
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
        activeWritableCalendars,
        handleCalendarToggle,
        handleMappingChange,
    };
};
export default useCustomizeCalendarImportModal;
