import { useHistory } from 'react-router';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { CollapsingBreadcrumbs, Icon, Option, SimpleDropdown } from '@proton/components/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import SelectOptions from '@proton/components/components/selectTwo/SelectOptions';
import { getCalendarSubpagePath, getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

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
        <div className="flex flex-nowrap flex-align-items-center md:hidden">
            <CollapsingBreadcrumbs
                breadcrumbs={[
                    {
                        text: c('breadcrumb').t`Calendars`,
                        key: 'calendars-main-route',
                        onClick: () => history.replace(getCalendarsSettingsPath({ fullPath: true })),
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
                    <SelectOptions<string>
                        selected={calendars.findIndex(({ ID }) => ID === calendar.ID) || 0}
                        onChange={({ value: calendarID }) =>
                            history.replace(getCalendarSubpagePath(calendarID, { fullPath: true }))
                        }
                    >
                        {calendars.map(({ ID, Name, Color }) => (
                            <Option key={ID} value={ID} title={Name}>
                                <div className="flex flex-nowrap flex-align-items-center">
                                    <CalendarSelectIcon color={Color} className="flex-item-noshrink mr-3" />
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
