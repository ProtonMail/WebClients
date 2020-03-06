import React from 'react';
import { Label, Row } from 'react-components';
import PropTypes from 'prop-types';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { getDateTimeState, getTimeInUtc } from '../eventForm/time';
import { getFrequencyModelChange } from '../eventForm/propertiesToModel';

import TimezoneSelector from '../../TimezoneSelector';

const TimezoneRow = ({ collapseOnMobile, startLabel, endLabel, model, setModel }) => {
    const handleChangeStart = (tzid) => {
        const startUtcDate = getTimeInUtc(model.start);
        const newStartUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), tzid));
        const newStart = getDateTimeState(newStartUtcDate, tzid);
        const newFrequencyModel = getFrequencyModelChange(model.start, newStart, model.frequencyModel);

        setModel({ ...model, start: newStart, frequencyModel: newFrequencyModel });
    };

    const handleChangeEnd = (tzid) => {
        const endUtcDate = getTimeInUtc(model.end);
        const newEndUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(endUtcDate), tzid));
        setModel({
            ...model,
            end: getDateTimeState(newEndUtcDate, tzid)
        });
    };

    return (
        <>
            <Row collapseOnMobile={collapseOnMobile}>
                <Label htmlFor="event-start-timezone-select">{startLabel}</Label>
                <div className="flex flex-nowrap flex-item-fluid">
                    <TimezoneSelector
                        id="event-start-timezone-select"
                        timezone={model.start.tzid}
                        onChange={handleChangeStart}
                    />
                </div>
            </Row>
            <Row collapseOnMobile={collapseOnMobile}>
                <Label htmlFor="event-end-timezone-select">{endLabel}</Label>
                <div className="flex flex-nowrap flex-item-fluid">
                    <TimezoneSelector
                        id="event-end-timezone-select"
                        timezone={model.end.tzid}
                        onChange={handleChangeEnd}
                    />
                </div>
            </Row>
        </>
    );
};

TimezoneRow.propTypes = {
    startLabel: PropTypes.string,
    endLabel: PropTypes.string,
    model: PropTypes.object,
    setModel: PropTypes.func,
    collapseOnMobile: PropTypes.bool
};

export default TimezoneRow;
