import React from 'react';
import { useLoading, useGetCalendarBootstrap, SelectTwo, Option, useGetAddresses } from '@proton/components';
import { Props as SelectProps } from '@proton/components/components/selectTwo/SelectTwo';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';
import { getDeviceNotifications } from '@proton/shared/lib/calendar/notificationModel';
import { notificationsToModel } from '@proton/shared/lib/calendar/notificationsToModel';
import CalendarIcon from '../../CalendarIcon';
import { getInitialMemberModel } from '../eventForm/state';

import './CalendarSelect.scss';

export interface Props extends Omit<SelectProps<string>, 'children'> {
    withIcon?: boolean;
    model: EventModel;
    setModel: (value: EventModel) => void;
    isCreateEvent: boolean;
    frozen?: boolean;
}

const CalendarSelect = ({ withIcon = false, model, setModel, isCreateEvent, frozen = false, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();

    const { color, id } = model.calendar;
    const options = model.calendars.filter(({ isSubscribed }) => !isSubscribed);
    const name = options.find(({ value }) => value === id)?.text;

    if (frozen) {
        return (
            <div className="pt0-5 pb0-5 flex">
                {withIcon !== false && <CalendarIcon className="mr1" color={color} />}
                <span className="text-ellipsis" title={name}>
                    {name}
                </span>
            </div>
        );
    }

    const handleChangeCalendar = async (selectedIndex: number) => {
        const { color: newColor, value: newId } = options[selectedIndex];

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
        const newDefaultPartDayNotifications = getDeviceNotifications(
            notificationsToModel(DefaultPartDayNotifications, false)
        );
        const newDefaultFullDayNotifications = getDeviceNotifications(
            notificationsToModel(DefaultFullDayNotifications, true)
        );

        const partDayNotifications =
            model.hasTouchedNotifications.partDay || !isCreateEvent
                ? model.partDayNotifications
                : newDefaultPartDayNotifications;

        const fullDayNotifications =
            model.hasTouchedNotifications.fullDay || !isCreateEvent
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
        <>
            {withIcon !== false && <CalendarIcon className="mr1" color={color} />}
            <SelectTwo
                value={id}
                loading={loading}
                onChange={({ selectedIndex }) => withLoading(handleChangeCalendar(selectedIndex))}
                {...rest}
            >
                {options.map(({ value, text, color: calendarColor }) => (
                    <Option value={value} title={text} key={value}>
                        <div className="flex flex-nowrap flex-align-items-center text-ellipsis">
                            <div
                                className="calendar-select-color flex-item-noshrink mr0-75"
                                style={{ backgroundColor: calendarColor }}
                            />
                            {text}
                        </div>
                    </Option>
                ))}
            </SelectTwo>
        </>
    );
};

export default CalendarSelect;
