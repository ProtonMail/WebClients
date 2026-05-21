import { TimeIntl } from '@proton/components';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

interface Props {
    time: number;
    options?: Intl.DateTimeFormatOptions;
    sameDayOptions?: Intl.DateTimeFormatOptions;
}

export const TimeCell = ({
    time,
    options = {
        year: 'numeric',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
    },
    sameDayOptions,
}: Props) => {
    return (
        <div className="text-ellipsis" title={readableTime(time, { locale: dateLocale, format: 'PP' })}>
            <span className="text-pre">
                <TimeIntl options={options} sameDayOptions={sameDayOptions}>
                    {time}
                </TimeIntl>
            </span>
        </div>
    );
};
