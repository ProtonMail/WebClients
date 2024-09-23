import { useHistory } from 'react-router';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import CollapsingBreadcrumbs from '@proton/components/components/collapsingBreadcrumbs/CollapsingBreadcrumbs';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import SelectOptions from '@proton/components/components/selectTwo/SelectOptions';
import { getCalendarSubpagePath, getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

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
        <div className="flex flex-nowrap items-center md:hidden">
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
                        className: 'flex-1',
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
                    className="shrink-0"
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
                                <div className="flex flex-nowrap items-center">
                                    <CalendarSelectIcon color={Color} className="shrink-0 mr-3" />
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
