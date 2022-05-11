import { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { CALENDAR_MODAL_TYPE } from '@proton/components/containers/calendar/calendarModal';
import {
    createCalendar,
    updateCalendarSettings,
    updateCalendarUserSettings,
    updateMember,
} from '@proton/shared/lib/api/calendars';
import {
    getOwnedPersonalCalendars,
    getProbablyActiveCalendars,
    getVisualCalendar,
} from '@proton/shared/lib/calendar/calendar';
import { setupCalendarKey } from '@proton/shared/lib/calendar/keys/setupCalendarKeys';
import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
import {
    CalendarNotificationSettings,
    CalendarSettings,
    CalendarWithOwnMembers,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import { CalendarCreateData } from '@proton/shared/lib/interfaces/calendar/Api';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';

import {
    useApi,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useNotifications,
    useReadCalendarBootstrap,
} from '../../../hooks';
import { useCalendarModelEventManager } from '../../eventManager';

const getHasChangedCalendarMemberData = (calendarPayload: CalendarCreateData, calendar: VisualCalendar) => {
    const { Name: oldName, Description: oldDescription, Color: oldColor, Display: oldDisplay } = calendar;
    const { Name: newName, Description: newDescription, Color: newColor, Display: newDisplay } = calendarPayload;

    return (
        oldColor.toLowerCase() !== newColor.toLowerCase() ||
        oldDisplay !== newDisplay ||
        oldName !== newName ||
        oldDescription !== newDescription
    );
};

const getHasChangedCalendarNotifications = (
    newNotifications: CalendarNotificationSettings[],
    oldNotifications: CalendarNotificationSettings[]
) => {
    return (
        newNotifications.length !== oldNotifications.length ||
        newNotifications.some(
            ({ Type: newType, Trigger: newTrigger }) =>
                !oldNotifications.find(
                    ({ Type: oldType, Trigger: oldTrigger }) => oldType === newType && oldTrigger === newTrigger
                )
        )
    );
};

const getHasChangedCalendarSettings = (
    newSettings: Required<
        Pick<CalendarSettings, 'DefaultEventDuration' | 'DefaultPartDayNotifications' | 'DefaultFullDayNotifications'>
    >,
    oldSettings?: CalendarSettings
) => {
    if (!oldSettings) {
        // we should not fall in here. If we do, assume changes are needed
        return true;
    }
    const {
        DefaultEventDuration: newDuration,
        DefaultPartDayNotifications: newPartDayNotifications,
        DefaultFullDayNotifications: newFullDayNotifications,
    } = newSettings;
    const {
        DefaultEventDuration: oldDuration,
        DefaultPartDayNotifications: oldPartDayNotifications,
        DefaultFullDayNotifications: oldFullDayNotifications,
    } = oldSettings;
    return (
        newDuration !== oldDuration ||
        getHasChangedCalendarNotifications(newPartDayNotifications, oldPartDayNotifications) ||
        getHasChangedCalendarNotifications(newFullDayNotifications, oldFullDayNotifications)
    );
};

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

        if (!isSubscribedCalendar) {
            await Promise.all([
                api(updateCalendarSettings(newCalendarID, calendarSettingsPayload)),
                (() => {
                    if (defaultCalendarID) {
                        return;
                    }
                    const ownedActiveCalendars = getProbablyActiveCalendars(getOwnedPersonalCalendars(calendars));
                    const newDefaultCalendarID = ownedActiveCalendars?.length
                        ? ownedActiveCalendars[0].ID
                        : newCalendarID;
                    return api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID }));
                })(),
            ]).catch(() => {
                createNotification({
                    type: 'warning',
                    text: c('Settings update growler warning').t`Failed to update settings`,
                });
            });
        }

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
                'DefaultEventDuration' | 'DefaultPartDayNotifications' | 'DefaultFullDayNotifications'
            >
        >
    ) => {
        const calendarID = calendar.ID;
        const { Color, Display, Description, Name } = calendarPayload;
        const [{ ID: memberID }] = getMemberAndAddress(await getAddresses(), calendar.Members);
        const hasChangedMemberData = getHasChangedCalendarMemberData(calendarPayload, calendar);
        const hasChangedSettings = getHasChangedCalendarSettings(
            calendarSettingsPayload,
            readCalendarBootstrap(calendarID)?.CalendarSettings
        );

        await Promise.all(
            [
                hasChangedMemberData && api(updateMember(calendarID, memberID, { Display, Color, Description, Name })),
                hasChangedSettings && api(updateCalendarSettings(calendarID, calendarSettingsPayload)),
            ].filter(isTruthy)
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
