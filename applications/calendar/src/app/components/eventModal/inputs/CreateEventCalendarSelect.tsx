import { useGetAddresses, useGetCalendarBootstrap } from '@proton/components';
import CalendarSelect from '@proton/components/components/calendarSelect/CalendarSelect';
import type { SelectTwoProps } from '@proton/components/components/selectTwo/SelectTwo';
import { useLoading } from '@proton/hooks';
import { notificationsToModel } from '@proton/shared/lib/calendar/alarms/notificationsToModel';
import type { CalendarMember, EventModel } from '@proton/shared/lib/interfaces/calendar';

import { getIsAvailableCalendar } from '../../../helpers/event';
import { getInitialMemberModel, getOrganizerAndSelfAddressModel } from '../eventForm/state';

export interface Props extends Omit<SelectTwoProps<string>, 'children'> {
    model: EventModel;
    setModel: (value: EventModel) => void;
    isCreateEvent: boolean;
    frozen?: boolean;
    isColorPerEventEnabled: boolean;
}

const CreateEventCalendarSelect = ({
    model,
    setModel,
    isCreateEvent,
    frozen = false,
    isColorPerEventEnabled,
    ...rest
}: Props) => {
    const [loading, withLoading] = useLoading();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();

    const {
        organizer,
        calendars,
        calendar: { id: calendarID },
    } = model;

    const options = calendars
        .filter(
            ({ value: id, isOwned, isWritable }) =>
                id === calendarID ||
                getIsAvailableCalendar({
                    isOwnedCalendar: isOwned,
                    isCalendarWritable: isWritable,
                    isInvitation: !!organizer,
                })
        )
        .map(({ value, text, color, permissions, isOwned, isSubscribed, isWritable, isUnknown }) => ({
            id: value,
            name: text,
            color,
            permissions,
            isOwned,
            isSubscribed,
            isWritable,
            isUnknown,
        }));
    const { name } = options.find(({ id }) => id === calendarID) || options[0];

    if (frozen) {
        return (
            <div className="py-2 flex w-full">
                <span className="text-ellipsis" title={name}>
                    {name}
                </span>
            </div>
        );
    }

    const handleChangeCalendar = async (newId: string) => {
        const { color, permissions, isOwned, isSubscribed, isWritable, isUnknown } =
            options.find(({ id }) => id === newId) || options[0];

        // grab members and default settings for the new calendar
        const {
            Members,
            CalendarSettings: {
                DefaultEventDuration: defaultEventDuration,
                DefaultPartDayNotifications,
                DefaultFullDayNotifications,
            },
        } = await getCalendarBootstrap(newId);
        const addresses = await getAddresses();

        const [Member = { ID: '', Email: '' } as CalendarMember] = Members;
        const memberEmail = Member.Email;
        const address = addresses.find(({ Email }) => Email === memberEmail);
        if (!memberEmail || !address) {
            throw new Error('Address does not exist');
        }
        const newDefaultPartDayNotifications = notificationsToModel(DefaultPartDayNotifications, false);
        const newDefaultFullDayNotifications = notificationsToModel(DefaultFullDayNotifications, true);

        const partDayNotifications = model.hasPartDayDefaultNotifications
            ? newDefaultPartDayNotifications
            : model.partDayNotifications;

        const fullDayNotifications = model.hasFullDayDefaultNotifications
            ? newDefaultFullDayNotifications
            : model.fullDayNotifications;

        setModel({
            ...model,
            calendar: { id: newId, color, permissions, isOwned, isSubscribed, isWritable, isUnknown },
            ...getInitialMemberModel(addresses, Members, Member, address),
            ...getOrganizerAndSelfAddressModel({
                attendees: model.attendees,
                addresses,
                addressID: address.ID,
                isAttendee: model.isAttendee,
            }),
            defaultEventDuration,
            partDayNotifications,
            fullDayNotifications,
        });
    };

    return (
        <CalendarSelect
            calendarID={calendarID}
            displayColor={isColorPerEventEnabled ? false : options.length > 1}
            options={options}
            onChange={({ value }) => withLoading(handleChangeCalendar(value))}
            loading={loading}
            {...rest}
        />
    );
};

export default CreateEventCalendarSelect;
