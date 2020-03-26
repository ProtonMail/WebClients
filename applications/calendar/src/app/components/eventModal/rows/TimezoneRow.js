import React, { useMemo } from 'react';
import { Label, Row } from 'react-components';
import PropTypes from 'prop-types';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { getDateTime, getDateTimeState, getTimeInUtc } from '../eventForm/time';
import getFrequencyModelChange from '../eventForm/getFrequencyModelChange';

import TimezoneSelector from '../../TimezoneSelector';

const TimezoneRow = ({ collapseOnMobile, startLabel, endLabel, model, setModel }) => {
    const handleChangeStart = (tzid) => {
        const startUtcDate = getTimeInUtc(model.start);
        const newStartUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), tzid));
        const newStart = getDateTimeState(newStartUtcDate, tzid);
        const newFrequencyModel = getFrequencyModelChange(model.start, newStart, model.frequencyModel);

        setModel({
            ...model,
            start: newStart,
            frequencyModel: newFrequencyModel
        });
    };

    const handleChangeEnd = (tzid) => {
        const endUtcDate = getTimeInUtc(model.end);
        const newEndUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(endUtcDate), tzid));

        setModel({
            ...model,
            end: getDateTimeState(newEndUtcDate, tzid)
        });
    };

    const startDateTime = useMemo(() => getDateTime(model.start), [model.start]);
    const endDateTime = useMemo(() => getDateTime(model.end), [model.end]);

    return (
        <>
            <Row collapseOnMobile={collapseOnMobile}>
                <Label htmlFor="event-start-timezone-select">{startLabel}</Label>
                <div className="flex flex-nowrap flex-item-fluid">
                    <TimezoneSelector
                        id="event-start-timezone-select"
                        data-test-id="create-event-modal/start:time-zone-dropdown"
                        timezone={model.start.tzid}
                        onChange={handleChangeStart}
                        date={startDateTime}
                    />
                </div>
            </Row>
            <Row collapseOnMobile={collapseOnMobile}>
                <Label htmlFor="event-end-timezone-select">{endLabel}</Label>
                <div className="flex flex-nowrap flex-item-fluid">
                    <TimezoneSelector
                        id="event-end-timezone-select"
                        data-test-id="create-event-modal/end:time-zone-dropdown"
                        timezone={model.end.tzid}
                        onChange={handleChangeEnd}
                        date={endDateTime}
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
