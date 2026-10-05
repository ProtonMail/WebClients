import { c } from 'ttag';

import Info from '../../components/link/Info';
import Time, { getReadableTime } from '../../components/time/Time';

interface Props {
    nextSubscriptionStart: number;
}

const StartDateCheckoutRow = ({ nextSubscriptionStart }: Props) => {
    // Plain text, as the info button's label is built from the tooltip
    const formattedTime = getReadableTime({ value: nextSubscriptionStart });

    return (
        <div className="flex flex-nowrap justify-space-between mb-4" data-testid="start-date-row">
            <span className="inline-flex items-center">
                <span className="mr-2">{c('Label').t`Start date`}</span>
                <Info title={c('Tooltip').t`The new subscription cycle starts on ${formattedTime}`} />
            </span>
            <Time>{nextSubscriptionStart}</Time>
        </div>
    );
};

export default StartDateCheckoutRow;
