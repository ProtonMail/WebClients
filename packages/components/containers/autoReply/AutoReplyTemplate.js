import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Button } from 'react-components';
import moment from 'moment';
import {
    getDaysOfMonthOptions,
    getDurationOptions,
    AutoReplyDuration,
    DAY_MILLISECONDS,
    getTimeZoneOptions
} from './utils';
import InfoLine from './InfoLine';

const AutoReplyTemplate = ({ autoresponder, onEdit }) => {
    const durationLabel = getDurationOptions().find(({ value }) => value === autoresponder.Repeat).text;
    const timezone = getTimeZoneOptions().find(({ value }) => value === autoresponder.Zone).text;

    const formatTime = (time) => {
        const hours = moment.utc(time).format('LT');

        if (autoresponder.Repeat === AutoReplyDuration.DAILY) {
            const firstDayOfWeek = moment.localeData().firstDayOfWeek();
            const orderedDaysSelected = [
                ...autoresponder.DaysSelected.filter((day) => day >= firstDayOfWeek).sort((a, b) => a - b),
                ...autoresponder.DaysSelected.filter((day) => day < firstDayOfWeek).sort((a, b) => a - b)
            ];
            const weekdays = orderedDaysSelected.map((day) => moment.weekdaysShort(day)).join(', ');
            return autoresponder.DaysSelected.length < 7
                ? c('Duration').t`Every ${weekdays} @ ${hours}`
                : c('Duration').t`Every day @ ${hours}`;
        } else if (autoresponder.Repeat === AutoReplyDuration.FIXED) {
            const date = moment(time).format('LL');
            return `${date} @ ${hours}`;
        } else if (autoresponder.Repeat === AutoReplyDuration.WEEKLY) {
            const dayOfWeek = moment.weekdays(Math.floor(time / DAY_MILLISECONDS));
            return c('Duration').t`Every ${dayOfWeek} @ ${hours}`;
        } else if (autoresponder.Repeat === AutoReplyDuration.MONTHLY) {
            const dayOfMonth = getDaysOfMonthOptions().find(
                ({ value }) => value === Math.floor(time / DAY_MILLISECONDS)
            ).text;
            return c('Duration').t`Every ${dayOfMonth} @ ${hours}`;
        } else if (autoresponder.Repeat === AutoReplyDuration.PERMANENT) {
            return c('Duration').t`n/a`;
        }
    };

    return (
        <div className="bordered-container p2 mw650p">
            <table>
                <tbody>
                    <InfoLine label={c('Label').t`Duration`}>{durationLabel}</InfoLine>
                    <InfoLine label={c('Label').t`Start`}>{formatTime(autoresponder.StartTime * 1000)}</InfoLine>
                    <InfoLine label={c('Label').t`End`}>{formatTime(autoresponder.EndTime * 1000)}</InfoLine>
                    <InfoLine label={c('Label').t`Timezone`}>{timezone}</InfoLine>
                    <InfoLine plain label={c('Label').t`Message`}>
                        <div dangerouslySetInnerHTML={{ __html: autoresponder.Message }} />
                    </InfoLine>
                </tbody>
            </table>
            <div className="flex">
                <Button onClick={onEdit} className="mlauto">
                    {c('Action').t`Edit`}
                </Button>
            </div>
        </div>
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
        Message: PropTypes.string
    }).isRequired,
    onEdit: PropTypes.func.isRequired
};

export default AutoReplyTemplate;
