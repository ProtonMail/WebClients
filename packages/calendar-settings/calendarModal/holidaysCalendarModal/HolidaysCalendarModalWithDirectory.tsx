import { useState } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useGetCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import CountrySelect from '@proton/components/components/country/CountrySelect';
import Form from '@proton/components/components/form/Form';
import ColorPicker from '@proton/components/components/input/ColorPicker';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { InputField } from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useEventManager from '@proton/components/hooks/useEventManager';
import useLoading from '@proton/hooks/useLoading';
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
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import type { CalendarCreateData } from '@proton/shared/lib/interfaces/calendar/Api';
import type {
    CalendarBootstrap,
    HolidaysDirectoryCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar/Calendar';
import type { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';

import { useCalendarModelEventManager } from '../../eventManager/CalendarModelEventManagerProvider';
import Notifications from '../../notifications/Notifications';
import BusySlotsCheckbox from '../BusySlotsCheckbox';
import { getCalendarModalSize } from '../helpers';
import { CALENDAR_MODAL_TYPE } from '../interface';
import { getDefaultModel } from '../personalCalendarModal/calendarModalState';
import joinHolidaysCalendar from './joinHolidaysCalendar';
import useHolidaysCalendarSelection from './useHolidaysCalendarSelection';

const getInitialCalendarNotifications = (bootstrap?: CalendarBootstrap) => {
    if (!bootstrap) {
        return [];
    }
    const { CalendarSettings } = bootstrap;

    return notificationsToModel(CalendarSettings.DefaultFullDayNotifications, true);
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
    const { call } = useEventManager();
    const { call: calendarCall } = useCalendarModelEventManager();
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const defaultModel = getDefaultModel(CALENDAR_TYPE.HOLIDAYS);
    const [makesUserBusy, setMakesUserBusy] = useState(
        calendarBootstrap?.CalendarSettings?.MakesUserBusy ?? defaultModel.shareBusySlots
    );

    const {
        countryOptions,
        preselectedOption,
        value,
        computedCalendar,
        directoryCalendarFromInput,
        languageOptions: filteredLanguageOptions,
        canShowHint,
        hasAlreadyJoinedSelectedCalendar,
        selectCountry,
        selectLanguage,
    } = useHolidaysCalendarSelection({ directory, holidaysCalendars, inputCalendar: inputHolidaysCalendar });

    const isEdit = !!inputHolidaysCalendar;

    const [color, setColor] = useState(inputHolidaysCalendar?.Color || getRandomAccentColor());
    const [notifications, setNotifications] = useState<NotificationModel[]>(
        getInitialCalendarNotifications(calendarBootstrap)
    ); // Note that we don't need to fill this state on holidays calendar edition since this field will not be displayed

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
                            getCalendarBootstrap,
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
                    await joinHolidaysCalendar({
                        holidaysCalendar: computedCalendar,
                        addresses,
                        getAddressKeys,
                        color,
                        notifications: formattedNotifications,
                        makesUserBusy,
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
        } catch {
            rest.onClose?.();
        }
    };

    const handleSelectLanguage = ({ value }: { value: any }) => {
        selectLanguage(value);
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
                        onSelectCountry={selectCountry}
                        error={validator([getErrorText()])}
                        hint={canShowHint ? hintText : undefined}
                    />
                )}
                {computedCalendar && filteredLanguageOptions.length > 1 && isComplete && (
                    <InputField
                        id="languageSelect"
                        as={SelectTwo}
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
