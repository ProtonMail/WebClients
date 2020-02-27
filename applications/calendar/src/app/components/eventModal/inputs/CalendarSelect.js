import React from 'react';
import PropTypes from 'prop-types';
import { useLoading, useGetCalendarBootstrap, Select, useGetAddresses } from 'react-components';
import CalendarIcon from '../../calendar/CalendarIcon';
import { getDeviceNotifications, notificationsToModel } from '../../../helpers/notifications';
import { getInitialMemberModel, hasEditedNotifications } from '../eventForm/state';

const CalendarSelect = ({ withIcon, model, setModel, ...rest }) => {
    const [loading, withLoading] = useLoading();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();

    const { color, id } = model.calendar;
    const options = model.calendars;

    const handleChangeCalendar = async ({ target }) => {
        const { value: newId, color: newColor } = options[target.selectedIndex];

        // grab default settings for the old calendar
        const {
            CalendarSettings: {
                DefaultPartDayNotifications: oldDefaultPartDayNotificationsSettings,
                DefaultFullDayNotifications: oldDefaultFullDayNotificationsSettings
            }
        } = await getCalendarBootstrap(id);

        const oldDefaultPartDayNotifications = getDeviceNotifications(
            notificationsToModel(oldDefaultPartDayNotificationsSettings, false)
        );
        const oldDefaultFullDayNotifications = getDeviceNotifications(
            notificationsToModel(oldDefaultFullDayNotificationsSettings, true)
        );

        // grab members and default settings for the new calendar
        const {
            Members,
            CalendarSettings: {
                DefaultEventDuration: defaultEventDuration,
                DefaultPartDayNotifications,
                DefaultFullDayNotifications
            }
        } = await getCalendarBootstrap(newId);
        const Addresses = await getAddresses();

        const [Member = {}] = Members;
        const Address = Addresses.find(({ Email }) => Member.Email === Email);
        if (!Member || !Address) {
            throw new Error('Address does not exist');
        }
        const newDefaultPartDayNotifications = getDeviceNotifications(
            notificationsToModel(DefaultPartDayNotifications, false)
        );
        const newDefaultFullDayNotifications = getDeviceNotifications(
            notificationsToModel(DefaultFullDayNotifications, true)
        );

        const partDayNotifications =
            hasEditedNotifications(oldDefaultPartDayNotifications, model.partDayNotifications) ||
            model.hasModifiedNotifications.partDay
                ? model.partDayNotifications
                : newDefaultPartDayNotifications;

        const fullDayNotifications =
            hasEditedNotifications(oldDefaultFullDayNotifications, model.fullDayNotifications) ||
            model.hasModifiedNotifications.fullDay
                ? model.fullDayNotifications
                : newDefaultFullDayNotifications;

        setModel({
            ...model,
            calendar: { id: newId, color: newColor },
            ...getInitialMemberModel(Addresses, Members, Member, Address),
            defaultEventDuration,
            partDayNotifications,
            fullDayNotifications
        });
    };

    return (
        <>
            {!withIcon ? <CalendarIcon className="mr1" color={color} /> : null}
            <Select
                options={options}
                value={id}
                loading={loading}
                onChange={(e) => withLoading(handleChangeCalendar(e))}
                {...rest}
            />
        </>
    );
};

CalendarSelect.propTypes = {
    withIcon: PropTypes.bool,
    model: PropTypes.object,
    setModel: PropTypes.func
};

export default CalendarSelect;
