import { useState } from 'react';
import moment from 'moment-timezone';
import { startOfDay, getRoundedHours } from '../utils';

/* 
    BE sends times and dates in UNIX format
    FE always works with locale times and converts to specified timezone before saving
*/
const toModel = (AutoResponder) => {
    const start = moment.unix(AutoResponder.StartTime).tz(AutoResponder.Zone);
    const end = moment.unix(AutoResponder.EndTime).tz(AutoResponder.Zone);

    return {
        message: AutoResponder.Message,
        duration: AutoResponder.Repeat,
        daysOfWeek: AutoResponder.DaysSelected,
        timeZone: AutoResponder.Zone,
        subject: AutoResponder.Subject,
        enabled: AutoResponder.IsEnabled,
        startDate: startOfDay(start),
        endDate: startOfDay(end),
        startTime: getRoundedHours(start),
        endTime: getRoundedHours(end)
    };
};

const toAutoResponder = (model) => ({
    Message: model.message,
    Repeat: model.duration,
    DaysSelected: model.daysOfWeek,
    Zone: model.timeZone,
    Subject: model.subject,
    IsEnabled: model.enabled,
    StartTime: moment(model.startDate + model.startTime)
        .tz(model.timeZone, true)
        .unix(),
    EndTime: moment(model.endDate + model.endTime)
        .tz(model.timeZone, true)
        .unix()
});

const useAutoReplyForm = (AutoResponder) => {
    const [model, setModel] = useState(() => toModel(AutoResponder));
    const updateModel = (key) => (value) => setModel((prev) => ({ ...prev, [key]: value }));

    return {
        model,
        toAutoResponder,
        updateModel
    };
};

export default useAutoReplyForm;
