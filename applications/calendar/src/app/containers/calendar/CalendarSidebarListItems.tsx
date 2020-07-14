import React from 'react';
import { Checkbox, SidebarListItem, SidebarListItemContent, SidebarListItemDiv } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
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
    const result = calendars.map(({ ID, Name, Display, Color }, i) => {
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
                    <SidebarListItemContent data-test-id="calendar-sidebar:user-calendars" left={left}>
                        {Name}
                    </SidebarListItemContent>
                </SidebarListItemDiv>
            </SidebarListItem>
        );
    });

    return <>{result}</>;
};

export default CalendarSidebarListItems;
