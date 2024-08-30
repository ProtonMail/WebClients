import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { getCalendarModalSize } from '@proton/components/containers/calendar/calendarModal/helpers';
import { CALENDAR_MODAL_TYPE } from '@proton/components/containers/calendar/calendarModal/interface';
import { useLoading } from '@proton/hooks';
import { removeHolidaysCalendar, updateCalendarSettings } from '@proton/shared/lib/api/calendars';
import { dedupeNotifications, sortNotificationsByAscendingTrigger } from '@proton/shared/lib/calendar/alarms';
import { modelToNotifications } from '@proton/shared/lib/calendar/alarms/modelToNotifications';
import { notificationsToModel } from '@proton/shared/lib/calendar/alarms/notificationsToModel';
import type { EditableCalendarSettings } from '@proton/shared/lib/calendar/calendar';
import { updateCalendar } from '@proton/shared/lib/calendar/calendar';
import {
    CALENDAR_TYPE,
    DEFAULT_EVENT_DURATION,
    MAX_DEFAULT_NOTIFICATIONS,
} from '@proton/shared/lib/calendar/constants';
import setupHolidaysCalendarHelper from '@proton/shared/lib/calendar/crypto/keys/setupHolidaysCalendarHelper';
import {
    findHolidaysCalendarByCountryCodeAndLanguageTag,
    getHolidaysCalendarsFromCountryCode,
    getSuggestedHolidaysCalendar,
} from '@proton/shared/lib/calendar/holidaysCalendar/holidaysCalendar';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { languageCode } from '@proton/shared/lib/i18n';
import { getBrowserLanguageTags } from '@proton/shared/lib/i18n/helper';
import type {
    CalendarBootstrap,
    CalendarCreateData,
    HolidaysDirectoryCalendar,
    NotificationModel,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import uniqueBy from '@proton/utils/uniqueBy';

import type { ModalProps } from '../../../../components';
import {
    ColorPicker,
    Form,
    InputFieldTwo as InputField,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Option,
    SelectTwo as Select,
    useFormErrors,
} from '../../../../components';
import CountrySelect from '../../../../components/country/CountrySelect';
import {
    useApi,
    useCalendarUserSettings,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useNotifications,
    useReadCalendarBootstrap,
} from '../../../../hooks';
import { useCalendarModelEventManager } from '../../../eventManager';
import Notifications from '../../notifications/Notifications';
import BusySlotsCheckbox from '../BusySlotsCheckbox';
import { getDefaultModel } from '../personalCalendarModal/calendarModalState';

const getInitialCalendarNotifications = (bootstrap?: CalendarBootstrap) => {
    if (!bootstrap) {
        return [];
    }
    const { CalendarSettings } = bootstrap;

    return notificationsToModel(CalendarSettings.DefaultFullDayNotifications, true);
};

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

const getModalTitle = (isEdit: boolean) => {
    if (isEdit) {
        return c('Modal title').t`Edit calendar`;
    }

    // translator: A holidays calendar includes bank holidays and observances
    return c('Modal title').t`Add public holidays`;
};

const getModalSubline = (isEdit: boolean) => {
    if (isEdit) {
        return;
    }

    // translator: A holidays calendar includes bank holidays and observances
    return c('Modal title').t`Get a country's official public holidays calendar.`;
};

interface Props extends ModalProps {
    /**
     * Calendar the user wants to update
     */
    calendar?: VisualCalendar;
    calendarBootstrap?: CalendarBootstrap;
    directory: HolidaysDirectoryCalendar[];
    /**
     * Holidays calendars the user has already joined
     */
    holidaysCalendars: VisualCalendar[];
    type: CALENDAR_MODAL_TYPE;
    onEditCalendar?: () => void;
}

const HolidaysCalendarModalWithDirectory = ({
    calendar: inputHolidaysCalendar,
    calendarBootstrap,
    directory,
    holidaysCalendars,
    type,
    onEditCalendar,
    ...rest
}: Props) => {
    const getAddresses = useGetAddresses();
    const [calendarUserSettings] = useCalendarUserSettings();
    const PrimaryTimezone = calendarUserSettings?.PrimaryTimezone!;
    const { call } = useEventManager();
    const { call: calendarCall } = useCalendarModelEventManager();
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const readCalendarBootstrap = useReadCalendarBootstrap();
    const defaultModel = getDefaultModel(CALENDAR_TYPE.HOLIDAYS);
    const [makesUserBusy, setMakesUserBusy] = useState(
        calendarBootstrap?.CalendarSettings?.MakesUserBusy ?? defaultModel.shareBusySlots
    );

    const memoizedHolidaysCalendars = useMemo(() => {
        // Prevent the list of user holidays calendars from changing (via event loop) once the modal opened.
        // This avoids possible UI jumps and glitches
        return holidaysCalendars;
    }, []);

    const visibleDirectory = useMemo(() => {
        const inputHolidaysCalendarID = inputHolidaysCalendar?.ID;

        return directory.filter((calendar) => {
            // a directory calendar is displayed if it's not hidden, or we're editing it
            return !calendar.Hidden || calendar.CalendarID === inputHolidaysCalendarID;
        });
    }, [directory]);

    const { directoryCalendarFromInput, suggestedCalendar } = useMemo(() => {
        // Directory calendar that we want to edit (when we get an input calendar)
        const directoryCalendarFromInput = visibleDirectory.find(
            ({ CalendarID }) => CalendarID === inputHolidaysCalendar?.ID
        );

        // Default holidays calendar found based on the user time zone and language
        const suggestedCalendar = getSuggestedHolidaysCalendar(
            visibleDirectory,
            PrimaryTimezone,
            languageCode,
            getBrowserLanguageTags()
        );

        return { directoryCalendarFromInput, suggestedCalendar };
    }, [inputHolidaysCalendar, visibleDirectory, PrimaryTimezone, languageCode]);

    // Check if the user has already joined the default holidays directory calendar.
    // If so, we don't want to pre-select that default calendar
    const hasAlreadyJoinedSuggestedCalendar = getHasAlreadyJoinedCalendar(
        memoizedHolidaysCalendars,
        suggestedCalendar,
        inputHolidaysCalendar
    );

    /**
     * We won't have preselection if we are in one of the following cases
     *  - user is editing an existing holidays calendar
     *  - user doesn't have a suggested calendar
     *  - user has already added the suggested calendar
     */
    const canPreselect = !directoryCalendarFromInput && !!suggestedCalendar && !hasAlreadyJoinedSuggestedCalendar;

    const isEdit = !!inputHolidaysCalendar;

    // Currently selected option in the modal
    const [selectedCalendar, setSelectedCalendar] = useState<HolidaysDirectoryCalendar | undefined>(
        directoryCalendarFromInput
    );

    // Calendar that is either the selected one or the default one if preselect possible
    // Because in some case, we do have a default calendar (suggested one) to use, but we want to act CountrySelect as if we don't (focus on suggested option)
    // we need to separate calendar that has been explicitly selected by user from the one that is being used (selected OR suggested)
    const computedCalendar = selectedCalendar || (canPreselect ? suggestedCalendar : undefined);

    // Check if currently selected holidays calendar has already been joined by the user
    // If already joined, we don't want the user to be able to "save" again, or he will get an error
    const hasAlreadyJoinedSelectedCalendar = getHasAlreadyJoinedCalendar(
        memoizedHolidaysCalendars,
        computedCalendar,
        inputHolidaysCalendar
    );

    const [color, setColor] = useState(inputHolidaysCalendar?.Color || getRandomAccentColor());
    const [notifications, setNotifications] = useState<NotificationModel[]>(
        getInitialCalendarNotifications(calendarBootstrap)
    ); // Note that we don't need to fill this state on holidays calendar edition since this field will not be displayed

    // Preselection hint is needed only if
    // - user can have a preselected calendar
    // - suggested calendar matches computed one
    const canShowHint = canPreselect && suggestedCalendar === computedCalendar;

    const countries: Pick<HolidaysDirectoryCalendar, 'Country' | 'CountryCode'>[] = useMemo(() => {
        return uniqueBy(visibleDirectory, ({ CountryCode }) => CountryCode)
            .map(({ Country, CountryCode }) => ({ Country, CountryCode }))
            .sort((a, b) => a.Country.localeCompare(b.Country));
    }, [visibleDirectory]);

    // We might have several calendars for a specific country, with different languages
    const filteredLanguageOptions: HolidaysDirectoryCalendar[] = useMemo(() => {
        return getHolidaysCalendarsFromCountryCode(visibleDirectory, computedCalendar?.CountryCode || '');
    }, [computedCalendar, visibleDirectory]);

    const preselectedOption = useMemo(() => {
        return canPreselect
            ? {
                  countryName: suggestedCalendar.Country,
                  countryCode: suggestedCalendar.CountryCode,
              }
            : undefined;
    }, [canPreselect, suggestedCalendar]);

    const value = useMemo(() => {
        return selectedCalendar
            ? {
                  countryName: selectedCalendar.Country,
                  countryCode: selectedCalendar.CountryCode,
              }
            : undefined;
    }, [selectedCalendar]);

    const handleSubmit = async () => {
        try {
            if (!onFormSubmit() || hasAlreadyJoinedSelectedCalendar) {
                return;
            }

            if (computedCalendar) {
                const formattedNotifications = modelToNotifications(
                    sortNotificationsByAscendingTrigger(dedupeNotifications(notifications))
                );
                /**
                 * Based on the inputHolidaysCalendar, we have several cases to cover:
                 * 1 - The user is updating colors or notifications of his holidays calendar
                 *      => We perform a classic calendar update
                 * 2 - The user is updating the country or the language of his holidays calendar
                 *      => We need to leave the old holidays calendar and then join a new one
                 * 3 - The user is joining a holidays calendar
                 *      => We just want to join a holidays calendar
                 */
                const addresses = await getAddresses();
                if (inputHolidaysCalendar) {
                    // 1 - Classic update: staying in the same holidays calendar
                    if (computedCalendar.CalendarID === directoryCalendarFromInput?.CalendarID) {
                        const calendarPayload: CalendarCreateData = {
                            Name: inputHolidaysCalendar.Name,
                            Description: inputHolidaysCalendar.Description,
                            Color: color,
                            Display: inputHolidaysCalendar.Display,
                        };
                        const calendarSettingsPayload: Required<EditableCalendarSettings> = {
                            DefaultEventDuration: DEFAULT_EVENT_DURATION,
                            DefaultFullDayNotifications: formattedNotifications,
                            DefaultPartDayNotifications: [],
                            MakesUserBusy: makesUserBusy,
                        };
                        await updateCalendar(
                            inputHolidaysCalendar,
                            calendarPayload,
                            calendarSettingsPayload,
                            readCalendarBootstrap,
                            getAddresses,
                            api
                        );
                        await call();
                        await calendarCall([directoryCalendarFromInput.CalendarID]);
                        onEditCalendar?.();
                    } else {
                        // 2 - Leave old holidays calendar and join a new one
                        // 2bis - If input holidays calendar doesn't exist anymore, we remove it and join new one

                        // Use route which does not need password confirmation to remove the calendar
                        await api(removeHolidaysCalendar(inputHolidaysCalendar.ID));

                        const calendar = await setupHolidaysCalendarHelper({
                            holidaysCalendar: computedCalendar,
                            addresses,
                            getAddressKeys,
                            color,
                            notifications: formattedNotifications,
                            priority: inputHolidaysCalendar.Priority,
                            api,
                        }).catch(() => {
                            createNotification({
                                type: 'error',
                                // translator: A holidays calendar includes bank holidays and observances
                                text: c('Notification in holidays calendar modal').t`Adding holidays calendar failed`,
                            });
                        });

                        // Make busyness update afterward via setting call
                        if (calendar && makesUserBusy !== calendar.CalendarSettings.MakesUserBusy) {
                            await api(updateCalendarSettings(calendar.Calendar.ID, { MakesUserBusy: makesUserBusy }));
                        }

                        await call();
                    }
                    createNotification({
                        type: 'success',
                        text: c('Notification in holidays calendar modal').t`Calendar updated`,
                    });
                } else {
                    // 3 - Joining a holidays calendar
                    const calendar = await setupHolidaysCalendarHelper({
                        holidaysCalendar: computedCalendar,
                        addresses,
                        getAddressKeys,
                        color,
                        notifications: formattedNotifications,
                        api,
                    });

                    // Make busyness update afterward via setting call
                    if (makesUserBusy !== calendar.CalendarSettings.MakesUserBusy) {
                        await api(updateCalendarSettings(calendar.Calendar.ID, { MakesUserBusy: makesUserBusy }));
                    }
                    await call();

                    createNotification({
                        type: 'success',
                        text: c('Notification in holidays calendar modal').t`Calendar added`,
                    });
                }

                rest.onClose?.();
            }
        } catch (error) {
            console.error(error);
            rest.onClose?.();
        }
    };

    const handleSelectCountry = useCallback(
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

    const handleSelectLanguage = ({ value }: { value: any }) => {
        const calendarsFromCountry = filteredLanguageOptions.find((calendar) => calendar.Language === value);
        setSelectedCalendar(calendarsFromCountry);
    };

    const getErrorText = () => {
        if (!rest.open) {
            // Avoid displaying the error during the exit animation
            return '';
        }
        if (hasAlreadyJoinedSelectedCalendar) {
            // translator: A holidays calendar includes bank holidays and observances
            return c('Error').t`You already added this holidays calendar`;
        }

        return '';
    };

    // translator: Hint text about the pre-selected country option in the holidays calendar modal
    const hintText = c('Info').t`Based on your time zone`;
    const isComplete = type === CALENDAR_MODAL_TYPE.COMPLETE;

    const countryOptions = useMemo(
        () =>
            countries.map((calendar) => ({
                countryName: calendar.Country,
                countryCode: calendar.CountryCode,
            })),
        [countries]
    );

    return (
        <ModalTwo
            as={Form}
            fullscreenOnMobile
            onSubmit={() => withLoading(handleSubmit())}
            size={getCalendarModalSize(type)}
            className="w-full"
            {...rest}
        >
            <ModalTwoHeader title={getModalTitle(isEdit)} subline={getModalSubline(isEdit)} />
            <ModalTwoContent className="holidays-calendar-modal-content">
                {isComplete && (
                    <CountrySelect
                        options={countryOptions}
                        preSelectedOption={preselectedOption}
                        value={value}
                        preSelectedOptionDivider={hintText}
                        onSelectCountry={handleSelectCountry}
                        error={validator([getErrorText()])}
                        hint={canShowHint ? hintText : undefined}
                    />
                )}
                {computedCalendar && filteredLanguageOptions.length > 1 && isComplete && (
                    <InputField
                        id="languageSelect"
                        as={Select}
                        label={c('Label').t`Language`}
                        value={computedCalendar.Language}
                        onChange={handleSelectLanguage}
                        aria-describedby="label-languageSelect"
                        data-testid="holidays-calendar-modal:language-select"
                    >
                        {filteredLanguageOptions.map((option) => (
                            <Option key={option.Language} value={option.Language} title={option.Language} />
                        ))}
                    </InputField>
                )}

                <InputField
                    id="colorSelect"
                    as={ColorPicker}
                    label={c('Label').t`Color`}
                    color={color}
                    onChange={(color: string) => setColor(color)}
                    data-testid="holidays-calendar-modal:color-select"
                />

                {isComplete && (
                    <>
                        <InputField
                            id="default-full-day-notification"
                            as={Notifications}
                            label={c('Label').t`Notifications`}
                            hasType
                            notifications={notifications}
                            defaultNotification={defaultModel.defaultFullDayNotification}
                            canAdd={notifications.length < MAX_DEFAULT_NOTIFICATIONS}
                            onChange={(notifications: NotificationModel[]) => {
                                setNotifications(notifications);
                            }}
                        />
                        <BusySlotsCheckbox
                            onChange={(nextMakesUserBusy) => {
                                setMakesUserBusy(nextMakesUserBusy);
                            }}
                            value={makesUserBusy}
                        />
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <>
                    <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                    <Button
                        loading={loading}
                        disabled={!computedCalendar}
                        type="submit"
                        color="norm"
                        data-testid="holidays-calendar-modal:submit"
                    >
                        {isEdit ? c('Action').t`Save` : c('Action').t`Add`}
                    </Button>
                </>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default HolidaysCalendarModalWithDirectory;
