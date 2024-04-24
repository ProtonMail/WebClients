import { TimeIntl } from '@proton/components';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

interface Props {
    time: number;
}

export const TimeCell = ({ time }: Props) => {
    return (
        <div className="text-ellipsis" title={readableTime(time, { locale: dateLocale, format: 'PP' })}>
            <span className="text-pre">
                <TimeIntl
                    options={{
                        year: 'numeric',
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: 'numeric',
                    }}
                >
                    {time}
                </TimeIntl>
            </span>
        </div>
    );
};
