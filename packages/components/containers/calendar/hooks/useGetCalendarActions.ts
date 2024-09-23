import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { CALENDAR_MODAL_TYPE } from '@proton/components/containers/calendar/calendarModal/interface';
import { createCalendar, updateCalendarSettings, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import {
    getOwnedPersonalCalendars,
    getProbablyActiveCalendars,
    getVisualCalendar,
    updateCalendar,
} from '@proton/shared/lib/calendar/calendar';
import { setupCalendarKey } from '@proton/shared/lib/calendar/crypto/keys/setupCalendarKeys';
import type { CalendarSettings, CalendarWithOwnMembers, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import type { CalendarCreateData } from '@proton/shared/lib/interfaces/calendar/Api';
import { getPrimaryKey } from '@proton/shared/lib/keys';

import {
    useApi,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useNotifications,
    useReadCalendarBootstrap,
} from '../../../hooks';
import { useCalendarModelEventManager } from '../../eventManager/calendar/CalendarModelEventManagerProvider';

interface Props {
    type?: CALENDAR_MODAL_TYPE;
    setCalendar: Dispatch<SetStateAction<VisualCalendar | undefined>>;
    setError: Dispatch<SetStateAction<boolean>>;
    defaultCalendarID?: string | null;
    onClose?: () => void;
    onCreateCalendar?: (id: string) => void;
    onEditCalendar?: () => void;
    calendars?: VisualCalendar[];
    isSubscribedCalendar?: boolean;
}

const useGetCalendarActions = ({
    type = CALENDAR_MODAL_TYPE.COMPLETE,
    setCalendar,
    setError,
    defaultCalendarID,
    onClose,
    onCreateCalendar,
    onEditCalendar,
    calendars,
    isSubscribedCalendar = false,
}: Props) => {
    const api = useApi();
    const getAddresses = useGetAddresses();
    const { call } = useEventManager();
    const { call: calendarCall } = useCalendarModelEventManager();
    const getAddressKeys = useGetAddressKeys();
    const readCalendarBootstrap = useReadCalendarBootstrap();
    const { createNotification } = useNotifications();

    const handleCreateCalendar = async (
        addressID: string,
        calendarPayload: CalendarCreateData,
        calendarSettingsPayload: Partial<CalendarSettings>
    ) => {
        const addressKeys = await getAddressKeys(addressID);

        const { privateKey: primaryAddressKey } = getPrimaryKey(addressKeys) || {};
        if (!primaryAddressKey) {
            createNotification({ text: c('Error').t`Primary address key is not decrypted`, type: 'error' });
            setError(true);
            throw new Error('Missing primary key');
        }

        const {
            Calendar,
            Calendar: { ID: newCalendarID },
        } = await api<{ Calendar: CalendarWithOwnMembers }>(
            createCalendar({
                ...calendarPayload,
                AddressID: addressID,
            })
        );
        const visualCalendar = getVisualCalendar(Calendar);

        await setupCalendarKey({
            api,
            calendarID: newCalendarID,
            addressID,
            getAddressKeys,
        }).catch((e: Error) => {
            // Hard failure if the keys fail to setup. Force the user to reload.
            setError(true);
            throw e;
        });

        onCreateCalendar?.(newCalendarID);
        // Set the calendar in case one of the following calls fails so that it ends up in the update function after this.
        setCalendar(visualCalendar);

        await Promise.all([
            api(updateCalendarSettings(newCalendarID, calendarSettingsPayload)),
            (() => {
                // If the user has a default calendar, we don't want to change it.
                // If the user has subscribed to a calendar, we don't allow it to be default one.
                if (defaultCalendarID || isSubscribedCalendar) {
                    return Promise.resolve();
                }
                const ownedActiveCalendars = getProbablyActiveCalendars(getOwnedPersonalCalendars(calendars));
                const newDefaultCalendarID = ownedActiveCalendars?.length ? ownedActiveCalendars[0].ID : newCalendarID;
                return api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID }));
            })(),
        ]).catch(() => {
            createNotification({
                type: 'warning',
                text: c('Settings update growler warning').t`Failed to update settings`,
            });
        });

        await call();

        onClose?.();

        createNotification({
            text: isSubscribedCalendar
                ? c('Success').t`Calendar added. It might take a few minutes to sync.`
                : c('Success').t`Calendar created`,
        });
    };

    const handleUpdateCalendar = async (
        calendar: VisualCalendar,
        calendarPayload: CalendarCreateData,
        calendarSettingsPayload: Required<
            Pick<
                CalendarSettings,
                'DefaultEventDuration' | 'DefaultPartDayNotifications' | 'DefaultFullDayNotifications' | 'MakesUserBusy'
            >
        >
    ) => {
        const calendarID = calendar.ID;
        await updateCalendar(
            calendar,
            calendarPayload,
            calendarSettingsPayload,
            readCalendarBootstrap,
            getAddresses,
            api
        );

        await call();
        await calendarCall([calendarID]);

        onEditCalendar?.();
        onClose?.();

        createNotification({
            text:
                type === CALENDAR_MODAL_TYPE.COMPLETE
                    ? c('Success').t`Calendar updated`
                    : c('Success').t`Calendar information updated`,
        });
    };

    return { handleCreateCalendar, handleUpdateCalendar };
};

export default useGetCalendarActions;
