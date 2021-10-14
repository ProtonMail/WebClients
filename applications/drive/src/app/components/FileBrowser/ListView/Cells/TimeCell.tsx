import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Time } from '@proton/components';

interface Props {
    time: number;
}

const TimeCell = ({ time }: Props) => {
    return (
        <div className="text-ellipsis" title={readableTime(time, 'PP', { locale: dateLocale })}>
            <span className="text-pre">
                <Time format="PPp">{time}</Time>
            </span>
        </div>
    );
};

export default TimeCell;
