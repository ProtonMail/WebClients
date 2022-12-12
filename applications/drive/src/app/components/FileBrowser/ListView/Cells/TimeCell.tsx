import { Time } from '@proton/components';
import { readableTimeLegacy } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

interface Props {
    time: number;
}

export const TimeCell = ({ time }: Props) => {
    return (
        <div className="text-ellipsis" title={readableTimeLegacy(time, 'PP', { locale: dateLocale })}>
            <span className="text-pre">
                <Time format="PPp">{time}</Time>
            </span>
        </div>
    );
};
