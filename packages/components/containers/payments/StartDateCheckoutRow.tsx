import { c } from 'ttag';

import { Info, Time } from '../../components';

export interface Props {
    nextSubscriptionStart: number;
}

const StartDateCheckoutRow = ({ nextSubscriptionStart }: Props) => {
    const formattedTime = <Time key="time-text">{nextSubscriptionStart}</Time>;

    return (
        <div className="flex flex-nowrap justify-space-between mb-4" data-testid="start-date-row">
            <span className="inline-flex items-center">
                <span className="mr-2">{c('Label').t`Start date`}</span>
                <Info title={c('Tooltip').jt`The new subscription cycle starts on ${formattedTime}`} />
            </span>
            {formattedTime}
        </div>
    );
};

export default StartDateCheckoutRow;
