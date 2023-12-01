import { c } from 'ttag';

import { Info, Time } from '../../components';

export interface Props {
    nextSubscriptionStart: number;
}

const StartDateCheckoutRow = ({ nextSubscriptionStart }: Props) => {
    const formattedTime = <Time key="time-text">{nextSubscriptionStart}</Time>;

    return (
        <div className="flex flex-nowrap justify-space-between mb-4" data-testid="start-date-row">
            <div className="pr-2">
                {c('Label').t`Start date`}{' '}
                <Info title={c('Tooltip').jt`The new subscription cycle starts on ${formattedTime}`} />
            </div>
            {formattedTime}
        </div>
    );
};

export default StartDateCheckoutRow;
