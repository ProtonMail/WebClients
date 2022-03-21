import { useLoading, useGetCalendarBootstrap, useGetAddresses } from '@proton/components';
import CalendarSelect from '@proton/components/components/calendarSelect/CalendarSelect';
import { Props as SelectProps } from '@proton/components/components/selectTwo/SelectTwo';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';
import { notificationsToModel } from '@proton/shared/lib/calendar/notificationsToModel';
import { getInitialMemberModel } from '../eventForm/state';

export interface Props extends Omit<SelectProps<string>, 'children'> {
    model: EventModel;
    setModel: (value: EventModel) => void;
    isCreateEvent: boolean;
    frozen?: boolean;
    isDuplicating: boolean;
}

const CreateEventCalendarSelect = ({
    model,
    setModel,
    isCreateEvent,
    frozen = false,
    isDuplicating,
    ...rest
}: Props) => {
    const [loading, withLoading] = useLoading();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();

    const { id: calendarID } = model.calendar;
    const options = model.calendars
        .filter(({ isSubscribed }) => !isSubscribed)
        .map(({ value, text, color }) => ({ id: value, name: text, color }));
    const { name } = options.find(({ id }) => id === calendarID) || options[0];

    if (frozen) {
        return (
            <div className="pt0-5 pb0-5 flex">
                <span className="text-ellipsis" title={name}>
                    {name}
                </span>
            </div>
        );
    }

    const handleChangeCalendar = async (newId: string) => {
        const { color: newColor } = options.find(({ id }) => id === newId) || options[0];

        // grab members and default settings for the new calendar
        const {
            Members,
            CalendarSettings: {
                DefaultEventDuration: defaultEventDuration,
                DefaultPartDayNotifications,
                DefaultFullDayNotifications,
            },
        } = await getCalendarBootstrap(newId);
        const Addresses = await getAddresses();

        const [Member = {}] = Members;
        const memberEmail = Member.Email;
        const Address = Addresses.find(({ Email }) => Email === memberEmail);
        if (!memberEmail || !Address) {
            throw new Error('Address does not exist');
        }
        const newDefaultPartDayNotifications = notificationsToModel(DefaultPartDayNotifications, false);
        const newDefaultFullDayNotifications = notificationsToModel(DefaultFullDayNotifications, true);

        const partDayNotifications =
            model.hasTouchedNotifications.partDay || ((!isCreateEvent || isDuplicating) && !model.isAllDay)
                ? model.partDayNotifications
                : newDefaultPartDayNotifications;

        const fullDayNotifications =
            model.hasTouchedNotifications.fullDay || ((!isCreateEvent || isDuplicating) && model.isAllDay)
                ? model.fullDayNotifications
                : newDefaultFullDayNotifications;

        setModel({
            ...model,
            calendar: { id: newId, color: newColor, isSubscribed: false },
            ...getInitialMemberModel(Addresses, Members, Member, Address),
            defaultEventDuration,
            partDayNotifications,
            fullDayNotifications,
        });
    };

    return (
        <CalendarSelect
            calendarID={calendarID}
            displayColor={options.length > 1}
            options={options}
            onChange={({ value }) => withLoading(handleChangeCalendar(value))}
            loading={loading}
            {...rest}
        />
    );
};

export default CreateEventCalendarSelect;
