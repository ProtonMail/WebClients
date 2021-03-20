import React, { useMemo } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { getWeekStartsOn, getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';
import { AutoReplyDuration } from 'proton-shared/lib/constants';
import { sanitizeString } from 'proton-shared/lib/sanitize';
import { getDaysOfMonthOptions } from './utils';
import { Field, Label } from '../../components';
import { getMatchingValues, toModel } from './AutoReplyForm/useAutoReplyForm';

const AutoReplyTemplate = ({ autoresponder, onEdit }) => {
    const { model, timezoneText, durationText } = useMemo(() => {
        const { timezone, duration } = getMatchingValues(autoresponder);
        return {
            timezoneText: timezone.text,
            durationText: duration.text,
            model: toModel(autoresponder, {
                timezone: timezone.value,
                duration: duration.value,
            }),
        };
    }, [autoresponder]);

    const formatTime = ({ date, time, day }, duration) => {
        if (duration === AutoReplyDuration.PERMANENT) {
            return c('Duration').t`n/a`;
        }

        const dateOptions = { locale: dateLocale };
        const formattedHours = format(time, 'p', dateOptions);

        if (duration === AutoReplyDuration.FIXED) {
            const formattedDate = format(date, 'PP', dateOptions);
            return `${formattedDate} @ ${formattedHours}`;
        }

        if (duration === AutoReplyDuration.DAILY) {
            const weekStartsOn = getWeekStartsOn(dateLocale);
            const weekdaysMap = getFormattedWeekdays('iii', dateOptions);
            const orderedDaysSelected = [
                ...autoresponder.DaysSelected.filter((day) => day >= weekStartsOn).sort((a, b) => a - b),
                ...autoresponder.DaysSelected.filter((day) => day < weekStartsOn).sort((a, b) => a - b),
            ];
            const weekdays = orderedDaysSelected.map((day) => weekdaysMap[day]).join(', ');
            return autoresponder.DaysSelected.length < 7
                ? c('Duration').t`Every ${weekdays} @ ${formattedHours}`
                : c('Duration').t`Every day @ ${formattedHours}`;
        }

        if (duration === AutoReplyDuration.WEEKLY) {
            const dayOfWeekString = getFormattedWeekdays('iiii', dateOptions)[day];
            return c('Duration').t`Every ${dayOfWeekString} @ ${formattedHours}`;
        }

        if (duration === AutoReplyDuration.MONTHLY) {
            const dayOfMonthString = getDaysOfMonthOptions(dateOptions).find(({ value }) => value === day).text;
            return c('Duration').t`Every ${dayOfMonthString} @ ${formattedHours}`;
        }
    };

    const [startText, endText] = useMemo(() => {
        return [formatTime(model.start, model.duration), formatTime(model.end, model.duration)];
    }, [model]);

    const sanitizedMessage = useMemo(() => {
        return sanitizeString(model.message);
    }, [model.message]);

    return (
        <>
            <Label className="">{c('Label').t`Duration`}</Label>
            <Field className="bordered bg-weak auto">
                <div
                    className="pl1 pr1 pt0-5 pb0-5 text-ellipsis cursor-pointer"
                    onClick={onEdit}
                    title={c('Action').t`Edit`}
                >
                    {durationText}
                </div>
            </Field>

            <Label className="">{c('Label').t`Start`}</Label>
            <Field className="bordered bg-weak auto">
                <div
                    className="pl1 pr1 pt0-5 pb0-5 text-ellipsis cursor-pointer"
                    onClick={onEdit}
                    title={c('Action').t`Edit`}
                >
                    {startText}
                </div>
            </Field>

            <Label className="">{c('Label').t`End`}</Label>
            <Field className="bordered bg-weak auto">
                <div
                    className="pl1 pr1 pt0-5 pb0-5 text-ellipsis cursor-pointer"
                    onClick={onEdit}
                    title={c('Action').t`Edit`}
                >
                    {endText}
                </div>
            </Field>

            <Label className="">{c('Label').t`Timezone`}</Label>
            <Field className="bordered bg-weak auto">
                <div
                    className="pl1 pr1 pt0-5 pb0-5 text-ellipsis cursor-pointer"
                    onClick={onEdit}
                    title={c('Action').t`Edit`}
                >
                    {timezoneText}
                </div>
            </Field>

            <Label className="">{c('Label').t`Message`}</Label>
            <Field className="bordered bg-weak auto">
                <div
                    className="pl1 pr1 pt0-5 pb0-5 text-break cursor-pointer"
                    onClick={onEdit}
                    title={c('Action').t`Edit`}
                    dangerouslySetInnerHTML={{ __html: sanitizedMessage }}
                />
            </Field>
        </>
    );
};

AutoReplyTemplate.propTypes = {
    autoresponder: PropTypes.shape({
        DaysSelected: PropTypes.arrayOf(PropTypes.number),
        IsEnabled: PropTypes.bool,
        Repeat: PropTypes.number,
        StartTime: PropTypes.number,
        EndTime: PropTypes.number,
        Zone: PropTypes.string,
        Message: PropTypes.string,
    }).isRequired,
    onEdit: PropTypes.func.isRequired,
};

export default AutoReplyTemplate;
