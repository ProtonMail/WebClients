import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Time } from '@proton/components';

interface Props {
    time: number;
}

const TimeCell = ({ time: modifyTime }: Props) => {
    return (
        <div className="text-ellipsis" title={readableTime(modifyTime, 'PP', { locale: dateLocale })}>
            <span className="text-pre">
                <Time key="dateModified" format="PPp">
                    {modifyTime}
                </Time>
            </span>
        </div>
    );
};

export default TimeCell;
