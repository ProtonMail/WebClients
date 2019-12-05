import { Label, Row } from 'react-components';
import React from 'react';
import TimezoneSelector from '../../TimezoneSelector';

const TimezoneRow = ({ collapseOnMobile, startLabel, endLabel, start, end, onChangeStart, onChangeEnd }) => {
    return (
        <>
            <Row collapseOnMobile={collapseOnMobile}>
                <Label htmlFor="event-start-timezone-select">{startLabel}</Label>
                <div className="flex flex-nowrap flex-item-fluid">
                    <TimezoneSelector
                        id="event-start-timezone-select"
                        timezone={start.tzid}
                        onChange={(tzid) => onChangeStart({ ...start, tzid } )}
                    />
                </div>
            </Row>
            <Row collapseOnMobile={collapseOnMobile}>
                <Label htmlFor="event-end-timezone-select">{endLabel}</Label>
                <div className="flex flex-nowrap flex-item-fluid">
                    <TimezoneSelector
                        id="event-end-timezone-select"
                        timezone={end.tzid}
                        onChange={(tzid) => onChangeEnd({ ...end, tzid })}
                    />
                </div>
            </Row>
        </>
    )
};

export default TimezoneRow;
