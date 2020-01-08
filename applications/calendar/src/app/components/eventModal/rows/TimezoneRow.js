import { Label, Row } from 'react-components';
import React from 'react';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import TimezoneSelector from '../../TimezoneSelector';
import { getDateTimeState, getTimeInUtc } from '../eventForm/time';

const TimezoneRow = ({ collapseOnMobile, startLabel, endLabel, start, end, onChangeStart, onChangeEnd }) => {
    const getUpdatedValue = (oldValue, tzid) => {
        const startUtcDate = getTimeInUtc(oldValue);
        const newStartUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), tzid));
        return getDateTimeState(newStartUtcDate, tzid);
    };

    return (
        <>
            <Row collapseOnMobile={collapseOnMobile}>
                <Label htmlFor="event-start-timezone-select">{startLabel}</Label>
                <div className="flex flex-nowrap flex-item-fluid">
                    <TimezoneSelector
                        id="event-start-timezone-select"
                        timezone={start.tzid}
                        onChange={(tzid) => onChangeStart(getUpdatedValue(start, tzid))}
                    />
                </div>
            </Row>
            <Row collapseOnMobile={collapseOnMobile}>
                <Label htmlFor="event-end-timezone-select">{endLabel}</Label>
                <div className="flex flex-nowrap flex-item-fluid">
                    <TimezoneSelector
                        id="event-end-timezone-select"
                        timezone={end.tzid}
                        onChange={(tzid) => onChangeEnd(getUpdatedValue(end, tzid))}
                    />
                </div>
            </Row>
        </>
    );
};

export default TimezoneRow;
