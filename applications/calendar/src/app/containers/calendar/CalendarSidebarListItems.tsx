import React from 'react';
import { c } from 'ttag';

import { Checkbox, classnames, SidebarListItem, SidebarListItemContent, SidebarListItemDiv } from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';

import { getConstrastingColor } from '../../helpers/color';

interface Props {
    calendars?: Calendar[];
    loading?: boolean;
    onChangeVisibility: (id: string, checked: boolean) => void;
}

const CalendarSidebarListItems = ({ calendars = [], loading = false, onChangeVisibility = noop }: Props) => {
    if (calendars.length === 0) {
        return null;
    }
    const result = calendars.map((calendar, i) => {
        const { ID, Name, Display, Color } = calendar;
        const isCalendarDisabled = getIsCalendarDisabled(calendar);

        const left = (
            <Checkbox
                className="mr0-25 flex-item-noshrink"
                color={getConstrastingColor(Color)}
                backgroundColor={Display ? Color : 'transparent'}
                borderColor={Color}
                checked={!!Display}
                disabled={loading}
                aria-describedby={`calendar-${i}`}
                onChange={({ target: { checked } }) => onChangeVisibility(ID, checked)}
            />
        );

        return (
            <SidebarListItem key={ID}>
                <SidebarListItemDiv>
                    <SidebarListItemContent
                        data-test-id="calendar-sidebar:user-calendars"
                        left={left}
                        className={classnames([isCalendarDisabled && 'color-weak', 'flex'])}
                    >
                        <div className="flex flex-nowrap">
                            <div className="text-ellipsis">{Name}</div>
                            {isCalendarDisabled && (
                                <div className="flex-item-noshrink">
                                    &nbsp;({c('Disabled calendar name suffix').t`disabled`})
                                </div>
                            )}
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemDiv>
            </SidebarListItem>
        );
    });

    return <>{result}</>;
};

export default CalendarSidebarListItems;
