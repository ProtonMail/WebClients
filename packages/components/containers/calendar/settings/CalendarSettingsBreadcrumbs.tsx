import {ButtonLike, CollapsingBreadcrumbs, Icon, Option, SimpleDropdown} from "@proton/components/components";
import {c} from "ttag";
import SelectOptions from "@proton/components/components/selectTwo/SelectOptions";
import CalendarSelectIcon from "@proton/components/components/calendarSelect/CalendarSelectIcon";
import React from "react";
import {useHistory} from "react-router";
import {VisualCalendar} from "@proton/shared/lib/interfaces/calendar";

interface Props {
    calendar: VisualCalendar;
    calendars: VisualCalendar[];
}

const CalendarSettingsBreadcrumbs = ({ calendar, calendars }: Props) => {
    const history = useHistory();

    if (calendars.length === 1) {
        return null;
    }

    return (
        <div className="flex flex-nowrap flex-align-items-center no-desktop no-tablet on-mobile-flex">
            <CollapsingBreadcrumbs
                breadcrumbs={[
                    {
                        text: c('breadcrumb').t`Calendars`,
                        key: 'calendars-main-route',
                        onClick: () => history.replace('/calendar/calendars'),
                    },
                    {
                        text: calendar.Name,
                        key: calendar.ID,
                        className: 'flex-item-fluid',
                    },
                ]}
            />
            {calendars && (
                <SimpleDropdown
                    as={ButtonLike}
                    shape="ghost"
                    color="weak"
                    icon
                    type="button"
                    className="flex-item-noshrink"
                    content={<Icon name="chevron-down" className="caret-like" />}
                    hasCaret={false}
                >
                    <SelectOptions
                        selected={calendars.findIndex(({ ID }) => ID === calendar.ID) || 0}
                        onChange={({ value: calendarID }) => history.replace(`/calendar/calendars/${calendarID}`)}
                    >
                        {calendars.map(({ ID, Name, Color }) => (
                            <Option key={ID} value={ID} title={Name}>
                                <div className="flex flex-nowrap flex-align-items-center">
                                    <CalendarSelectIcon color={Color} className="flex-item-noshrink mr0-75" />
                                    <div className="text-ellipsis">{Name}</div>
                                </div>
                            </Option>
                        ))}
                    </SelectOptions>
                </SimpleDropdown>
            )}
        </div>
    );
};

export default CalendarSettingsBreadcrumbs;
