import React from 'react';
import PropTypes from 'prop-types';
import { Label, Row, DateInput, TimeInput, useActiveBreakpoint } from 'react-components';
import { c } from 'ttag';

const TimeEventRow = ({ model, setModel, errors, displayWeekNumbers, weekStartsOn }) => {
    const { isNarrow } = useActiveBreakpoint();

    if (isNarrow) {
        return (
            <>
                <Row>
                    <Label htmlFor="startDate">{c('Label').t`From`}</Label>
                    <div className="flex-item-fluid">
                        <div className="flex flex-nowrap">
                            <DateInput
                                id="startDate"
                                className="mr0-5"
                                required
                                value={model.start.date}
                                onChange={(newDate) => setModel({ ...model, start: { ...model.start, date: newDate } })}
                                aria-invalid={!!errors.start}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                            />
                            {!model.isAllDay ? (
                                <TimeInput
                                    value={model.start.time}
                                    onChange={(newTime) =>
                                        setModel({ ...model, start: { ...model.start, time: newTime } })
                                    }
                                    aria-invalid={!!errors.start}
                                />
                            ) : null}
                        </div>
                    </div>
                </Row>
                <Row>
                    <Label htmlFor="endDate">{c('Label').t`To`}</Label>
                    <div className="flex-item-fluid">
                        <div className="flex flex-nowrap mb0-5">
                            <DateInput
                                id="endDate"
                                className="mr0-5"
                                required
                                value={model.end.date}
                                onChange={(newDate) => setModel({ ...model, end: { ...model.end, date: newDate } })}
                                aria-invalid={!!errors.end}
                                displayWeekNumbers={displayWeekNumbers}
                            />
                            {!model.isAllDay ? (
                                <TimeInput
                                    value={model.end.time}
                                    onChange={(newTime) => setModel({ ...model, end: { ...model.end, time: newTime } })}
                                    aria-invalid={!!errors.end}
                                />
                            ) : null}
                        </div>
                    </div>
                </Row>
            </>
        );
    }

    return (
        <Row>
            <Label>{c('Label').t`Time`}</Label>
            <div className="flex-item-fluid">
                <div className="flex flex-nowrap flex-items-center">
                    <DateInput
                        id="startDate"
                        className="mr0-5"
                        required
                        value={model.start.date}
                        onChange={(newDate) => setModel({ ...model, start: { ...model.start, date: newDate } })}
                        aria-invalid={!!errors.start}
                        displayWeekNumbers={displayWeekNumbers}
                        weekStartsOn={weekStartsOn}
                    />
                    {!model.isAllDay ? (
                        <TimeInput
                            className="mr0-5"
                            value={model.start.time}
                            onChange={(newTime) => setModel({ ...model, start: { ...model.start, time: newTime } })}
                            aria-invalid={!!errors.start}
                        />
                    ) : null}
                    <span className="mr1">-</span>
                    <DateInput
                        id="endDate"
                        className="mr0-5"
                        required
                        value={model.end.date}
                        onChange={(newDate) => setModel({ ...model, end: { ...model.end, date: newDate } })}
                        aria-invalid={!!errors.end}
                        displayWeekNumbers={displayWeekNumbers}
                    />
                    {!model.isAllDay ? (
                        <TimeInput
                            value={model.end.time}
                            onChange={(newTime) => setModel({ ...model, end: { ...model.end, time: newTime } })}
                            aria-invalid={!!errors.end}
                        />
                    ) : null}
                </div>
            </div>
        </Row>
    );
};

TimeEventRow.propTypes = {
    model: PropTypes.object,
    setModel: PropTypes.func.isRequired,
    errors: PropTypes.object,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number
};

export default TimeEventRow;
