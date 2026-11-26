import { useCallback, useMemo, useState } from 'react';

import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import {
    findHolidaysCalendarByCountryCodeAndLanguageTag,
    getHolidaysCalendarsFromCountryCode,
    getSuggestedHolidaysCalendar,
} from '@proton/shared/lib/calendar/holidaysCalendar/holidaysCalendar';
import { languageCode } from '@proton/shared/lib/i18n';
import { getBrowserLanguageTags } from '@proton/shared/lib/i18n/helper';
import type { HolidaysDirectoryCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import uniqueBy from '@proton/utils/uniqueBy';

interface HolidaysCountryOption {
    countryName: string;
    countryCode: string;
}

const getHasAlreadyJoinedCalendar = (
    holidaysCalendars: VisualCalendar[],
    calendar?: HolidaysDirectoryCalendar,
    inputCalendar?: VisualCalendar
) => {
    if (!calendar) {
        return false;
    }
    const { CalendarID } = calendar;
    const holidaysCalendar = holidaysCalendars.find(({ ID }) => ID === CalendarID);

    return !!holidaysCalendar && holidaysCalendar.ID !== inputCalendar?.ID;
};

interface Options {
    directory: HolidaysDirectoryCalendar[];
    /** Holidays calendars the user has already joined */
    holidaysCalendars: VisualCalendar[];
    /** Calendar the user wants to update */
    inputCalendar?: VisualCalendar;
}

/**
 * Country and language selection of a holidays directory calendar. It suggests one from the user's time zone and
 * language, unless the user has already joined it.
 */
const useHolidaysCalendarSelection = ({ directory, holidaysCalendars, inputCalendar }: Options) => {
    const [calendarUserSettings] = useCalendarUserSettings();
    const PrimaryTimezone = calendarUserSettings?.PrimaryTimezone!;

    // Kept as first received: the event loop updating the list while the user picks would make the UI jump
    const [initialHolidaysCalendars] = useState(holidaysCalendars);

    const visibleDirectory = useMemo(() => {
        const inputHolidaysCalendarID = inputCalendar?.ID;

        return directory.filter((calendar) => {
            return !calendar.Hidden || calendar.CalendarID === inputHolidaysCalendarID;
        });
    }, [directory]);

    const { directoryCalendarFromInput, suggestedCalendar } = useMemo(() => {
        const directoryCalendarFromInput = visibleDirectory.find(({ CalendarID }) => CalendarID === inputCalendar?.ID);
        const suggestedCalendar = getSuggestedHolidaysCalendar(
            visibleDirectory,
            PrimaryTimezone,
            languageCode,
            getBrowserLanguageTags()
        );

        return { directoryCalendarFromInput, suggestedCalendar };
    }, [inputCalendar, visibleDirectory, PrimaryTimezone, languageCode]);

    const hasAlreadyJoinedSuggestedCalendar = getHasAlreadyJoinedCalendar(
        initialHolidaysCalendars,
        suggestedCalendar,
        inputCalendar
    );

    // No preselection when editing a calendar, or when the suggested calendar is missing or already added
    const canPreselect = !directoryCalendarFromInput && !!suggestedCalendar && !hasAlreadyJoinedSuggestedCalendar;

    const [selectedCalendar, setSelectedCalendar] = useState<HolidaysDirectoryCalendar | undefined>(
        directoryCalendarFromInput
    );

    // The choice, or else the suggestion. `value` holds only the choice, so CountrySelect shows the suggestion as preselected
    const computedCalendar = selectedCalendar || (canPreselect ? suggestedCalendar : undefined);

    // Joining it again would fail
    const hasAlreadyJoinedSelectedCalendar = getHasAlreadyJoinedCalendar(
        initialHolidaysCalendars,
        computedCalendar,
        inputCalendar
    );

    const canShowHint = canPreselect && suggestedCalendar === computedCalendar;

    const countryOptions: HolidaysCountryOption[] = useMemo(() => {
        return uniqueBy(visibleDirectory, ({ CountryCode }) => CountryCode)
            .sort((a, b) => a.Country.localeCompare(b.Country))
            .map(({ Country, CountryCode }) => ({ countryName: Country, countryCode: CountryCode }));
    }, [visibleDirectory]);

    // One calendar per language of the country
    const languageOptions: HolidaysDirectoryCalendar[] = useMemo(() => {
        return getHolidaysCalendarsFromCountryCode(visibleDirectory, computedCalendar?.CountryCode || '');
    }, [computedCalendar, visibleDirectory]);

    const preselectedOption: HolidaysCountryOption | undefined = useMemo(() => {
        return canPreselect
            ? {
                  countryName: suggestedCalendar.Country,
                  countryCode: suggestedCalendar.CountryCode,
              }
            : undefined;
    }, [canPreselect, suggestedCalendar]);

    const value: HolidaysCountryOption | undefined = useMemo(() => {
        return selectedCalendar
            ? {
                  countryName: selectedCalendar.Country,
                  countryCode: selectedCalendar.CountryCode,
              }
            : undefined;
    }, [selectedCalendar]);

    const selectCountry = useCallback(
        (countryCode: string) => {
            const newSelected = findHolidaysCalendarByCountryCodeAndLanguageTag(visibleDirectory, countryCode, [
                languageCode,
                ...getBrowserLanguageTags(),
            ]);

            if (newSelected) {
                setSelectedCalendar(newSelected);
            }
        },
        [visibleDirectory, setSelectedCalendar]
    );

    const selectLanguage = (language: string) => {
        setSelectedCalendar(languageOptions.find((calendar) => calendar.Language === language));
    };

    return {
        countryOptions,
        preselectedOption,
        value,
        computedCalendar,
        directoryCalendarFromInput,
        languageOptions,
        canShowHint,
        hasAlreadyJoinedSelectedCalendar,
        selectCountry,
        selectLanguage,
    };
};

export default useHolidaysCalendarSelection;
