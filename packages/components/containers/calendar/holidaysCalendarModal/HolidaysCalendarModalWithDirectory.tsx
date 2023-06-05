import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { removeMember } from '@proton/shared/lib/api/calendars';
import { dedupeNotifications, sortNotificationsByAscendingTrigger } from '@proton/shared/lib/calendar/alarms';
import { modelToNotifications } from '@proton/shared/lib/calendar/alarms/modelToNotifications';
import { notificationsToModel } from '@proton/shared/lib/calendar/alarms/notificationsToModel';
import { updateCalendar } from '@proton/shared/lib/calendar/calendar';
import { DEFAULT_EVENT_DURATION, MAX_DEFAULT_NOTIFICATIONS } from '@proton/shared/lib/calendar/constants';
import setupHolidaysCalendarHelper from '@proton/shared/lib/calendar/crypto/keys/setupHolidaysCalendarHelper';
import {
    findHolidaysCalendarByCountryCodeAndLanguageTag,
    getHolidaysCalendarsFromCountryCode,
    getSuggestedHolidaysCalendar,
} from '@proton/shared/lib/calendar/holidaysCalendar/holidaysCalendar';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { languageCode } from '@proton/shared/lib/i18n';
import { getBrowserLanguageTags } from '@proton/shared/lib/i18n/helper';
import {
    CalendarBootstrap,
    CalendarCreateData,
    CalendarSettings,
    HolidaysDirectoryCalendar,
    NotificationModel,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import uniqueBy from '@proton/utils/uniqueBy';

import {
    ColorPicker,
    Form,
    InputFieldTwo as InputField,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    Option,
    SelectTwo as Select,
    useFormErrors,
} from '../../../components';
import CountrySelect from '../../../components/country/CountrySelect';
import {
    useAddresses,
    useApi,
    useCalendarUserSettings,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useLoading,
    useNotifications,
    useReadCalendarBootstrap,
} from '../../../hooks';
import { useCalendarModelEventManager } from '../../eventManager';
import { CALENDAR_MODAL_TYPE } from '../calendarModal';
import { getDefaultModel } from '../calendarModal/calendarModalState';
import Notifications from '../notifications/Notifications';

const getInitialCalendar = (
    inputCalendar: HolidaysDirectoryCalendar | undefined,
    defaultCalendar: HolidaysDirectoryCalendar | undefined,
    canPreselect: boolean
) => {
    // If we have an input holidays calendar set, we want to edit it.
    // The initial selected option needs to be this one so that we can fill all modal inputs
    if (inputCalendar) {
        return inputCalendar;
    }

    // Else we return the default calendar (calendar found based on the user timezone) if one is found and hasn't been already subscribed by the user
    return canPreselect ? defaultCalendar : undefined;
};

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
    const [addresses] = useAddresses();
    const getAddresses = useGetAddresses();
    const [{ PrimaryTimezone }] = useCalendarUserSettings();
    const { call } = useEventManager();
    const { call: calendarCall } = useCalendarModelEventManager();
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const readCalendarBootstrap = useReadCalendarBootstrap();

    const { inputCalendar, suggestedCalendar } = useMemo(() => {
        // Directory calendar that we want to edit (when we get an input calendar)
        const inputCalendar = directory.find(({ CalendarID }) => CalendarID === inputHolidaysCalendar?.ID);
        // Default holidays calendar found based on the user time zone and language
        const suggestedCalendar = getSuggestedHolidaysCalendar(
            directory,
            PrimaryTimezone,
            languageCode,
            getBrowserLanguageTags()
        );

        return { inputCalendar, suggestedCalendar };
    }, [inputHolidaysCalendar, directory, PrimaryTimezone, languageCode]);

    // Check if the user has already joined the default holidays directory calendar.
    // If so, we don't want to pre-select that default calendar
    const hasAlreadyJoinedSuggestedCalendar = getHasAlreadyJoinedCalendar(
        holidaysCalendars,
        suggestedCalendar,
        inputHolidaysCalendar
    );
    const canPreselect = !!suggestedCalendar && !hasAlreadyJoinedSuggestedCalendar;
    const isEdit = !!inputHolidaysCalendar;

    // Currently selected option in the modal
    const [selectedCalendar, setSelectedCalendar] = useState<HolidaysDirectoryCalendar | undefined>(
        getInitialCalendar(inputCalendar, suggestedCalendar, canPreselect)
    );

    // Check if currently selected holidays calendar has already been joined by the user
    // If already joined, we don't want the user to be able to "save" again, or he will get an error
    const hasAlreadyJoinedSelectedCalendar = getHasAlreadyJoinedCalendar(
        holidaysCalendars,
        selectedCalendar,
        inputHolidaysCalendar
    );

    const [color, setColor] = useState(inputHolidaysCalendar?.Color || getRandomAccentColor());
    const [notifications, setNotifications] = useState<NotificationModel[]>(
        getInitialCalendarNotifications(calendarBootstrap)
    ); // Note that we don't need to fill this state on holidays calendar edition since this field will not be displayed

    const canShowHint =
        suggestedCalendar && suggestedCalendar === selectedCalendar && !hasAlreadyJoinedSuggestedCalendar;

    // We want to display one option per country, so we need to filter them
    const filteredCalendars: HolidaysDirectoryCalendar[] = useMemo(() => {
        return uniqueBy(directory, ({ CountryCode }) => CountryCode).sort((a, b) => a.Country.localeCompare(b.Country));
    }, [directory]);

    // We might have several calendars for a specific country, with different languages
    const languageOptions: HolidaysDirectoryCalendar[] = useMemo(() => {
        return getHolidaysCalendarsFromCountryCode(directory, selectedCalendar?.CountryCode || '');
    }, [selectedCalendar]);

    const handleSubmit = async () => {
        try {
            if (!onFormSubmit() || hasAlreadyJoinedSelectedCalendar) {
                return;
            }

            if (selectedCalendar) {
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
                if (inputHolidaysCalendar && inputCalendar) {
                    // 1 - Classic update
                    if (selectedCalendar === inputCalendar) {
                        const calendarPayload: CalendarCreateData = {
                            Name: inputHolidaysCalendar.Name,
                            Description: inputHolidaysCalendar.Description,
                            Color: color,
                            Display: inputHolidaysCalendar.Display,
                        };
                        const calendarSettingsPayload: Required<
                            Pick<
                                CalendarSettings,
                                'DefaultEventDuration' | 'DefaultPartDayNotifications' | 'DefaultFullDayNotifications'
                            >
                        > = {
                            DefaultEventDuration: DEFAULT_EVENT_DURATION,
                            DefaultFullDayNotifications: formattedNotifications,
                            DefaultPartDayNotifications: [],
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
                        await calendarCall([inputCalendar.CalendarID]);
                        onEditCalendar?.();
                    } else {
                        // 2 - Leave old holidays calendar and join a new one
                        await api(removeMember(inputHolidaysCalendar.ID, inputHolidaysCalendar.Members[0].ID));

                        await setupHolidaysCalendarHelper({
                            holidaysCalendar: selectedCalendar,
                            addresses,
                            getAddressKeys,
                            color,
                            notifications: formattedNotifications,
                            api,
                        }).catch(() => {
                            createNotification({
                                type: 'error',
                                // translator: A holidays calendar includes bank holidays and observances
                                text: c('Notification in holidays calendar modal').t`Adding holidays calendar failed`,
                            });
                        });
                        await call();
                    }
                    createNotification({
                        type: 'success',
                        text: c('Notification in holidays calendar modal').t`Calendar updated`,
                    });
                } else {
                    // 3 - Joining a holidays calendar
                    await setupHolidaysCalendarHelper({
                        holidaysCalendar: selectedCalendar,
                        addresses,
                        getAddressKeys,
                        color,
                        notifications: formattedNotifications,
                        api,
                    });
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

    const handleSelectCountry = (countryCode: string) => {
        const newSelected = findHolidaysCalendarByCountryCodeAndLanguageTag(directory, countryCode, [
            languageCode,
            ...getBrowserLanguageTags(),
        ]);
        if (newSelected) {
            setSelectedCalendar(newSelected);
        }
    };

    const handleSelectLanguage = ({ value }: { value: any }) => {
        const calendarsFromCountry = languageOptions.find((calendar) => calendar.Language === value);
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

    return (
        <Modal as={Form} fullscreenOnMobile onSubmit={() => withLoading(handleSubmit())} size="large" {...rest}>
            <ModalHeader title={getModalTitle(isEdit)} subline={getModalSubline(isEdit)} />
            <ModalContent className="holidays-calendar-modal-content">
                {isComplete && (
                    <CountrySelect
                        options={filteredCalendars.map((calendar) => ({
                            countryName: calendar.Country,
                            countryCode: calendar.CountryCode,
                        }))}
                        preSelectedOption={
                            canPreselect
                                ? {
                                      countryName: suggestedCalendar.Country,
                                      countryCode: suggestedCalendar.CountryCode,
                                  }
                                : undefined
                        }
                        value={
                            selectedCalendar
                                ? {
                                      countryName: selectedCalendar.Country,
                                      countryCode: selectedCalendar.CountryCode,
                                  }
                                : undefined
                        }
                        preSelectedOptionDivider={hintText}
                        onSelectCountry={handleSelectCountry}
                        error={validator([getErrorText()])}
                        hint={canShowHint ? hintText : undefined}
                    />
                )}

                {selectedCalendar && languageOptions.length > 1 && isComplete && (
                    <InputField
                        id="languageSelect"
                        as={Select}
                        label={c('Label').t`Language`}
                        value={selectedCalendar.Language}
                        onChange={handleSelectLanguage}
                        aria-describedby="label-languageSelect"
                        data-testid="holidays-calendar-modal:language-select"
                    >
                        {languageOptions.map((option) => (
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
                    <InputField
                        id="default-full-day-notification"
                        as={Notifications}
                        label={c('Label').t`Notifications`}
                        hasType
                        notifications={notifications}
                        defaultNotification={getDefaultModel().defaultFullDayNotification}
                        canAdd={notifications.length < MAX_DEFAULT_NOTIFICATIONS}
                        onChange={(notifications: NotificationModel[]) => {
                            setNotifications(notifications);
                        }}
                    />
                )}
            </ModalContent>
            <ModalFooter>
                <>
                    <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                    <Button
                        loading={loading}
                        disabled={!selectedCalendar}
                        type="submit"
                        color="norm"
                        data-testid="holidays-calendar-modal:submit"
                    >
                        {isEdit ? c('Action').t`Save` : c('Action').t`Add`}
                    </Button>
                </>
            </ModalFooter>
        </Modal>
    );
};

export default HolidaysCalendarModalWithDirectory;
