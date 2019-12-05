import { Label, Row } from 'react-components';
import CalendarSelect from '../inputs/CalendarSelect';
import React from 'react';

const CalendarSelectRow = ({ label, collapseOnMobile, ...rest }) => {
    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label htmlFor="event-calendar-select">{label}</Label>
            <div className="flex flex-nowrap flex-item-fluid flex-items-center">
                <CalendarSelect id="event-calendar-select"{...rest}/>
            </div>
        </Row>
    )
};

export default CalendarSelectRow;
