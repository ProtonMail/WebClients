import React, { useMemo } from 'react';
import { Label, Row } from 'react-components';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { getDateTime, getDateTimeState, getTimeInUtc } from '../eventForm/time';
import getFrequencyModelChange from '../eventForm/getFrequencyModelChange';

import TimezoneSelector from '../../TimezoneSelector';
import { EventModel } from '../../../interfaces/EventModel';

interface Props {
    collapseOnMobile?: boolean;
    startLabel?: string;
    endLabel?: string;
    model: EventModel;
    setModel: (value: EventModel) => void;
}

const TimezoneRow = ({ collapseOnMobile, startLabel, endLabel, model, setModel }: Props) => {
    const handleChangeStart = (tzid: string) => {
        const startUtcDate = getTimeInUtc(model.start, false);
        const newStartUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), tzid));
        const newStart = getDateTimeState(newStartUtcDate, tzid);
        const newFrequencyModel = getFrequencyModelChange(model.start, newStart, model.frequencyModel);

        setModel({
            ...model,
            start: newStart,
            frequencyModel: newFrequencyModel
        });
    };

    const handleChangeEnd = (tzid: string) => {
        const endUtcDate = getTimeInUtc(model.end, false);
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

export default TimezoneRow;
