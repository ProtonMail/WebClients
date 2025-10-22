import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

import { useDealContext } from '../shared/deal/DealContext';

const DealSaveSentence = ({
    sentence,
    sentenceSaveType,
}: {
    sentence?: string;
    sentenceSaveType?: 'switch-yearly' | 'switch-two-year' | 'limited-time-deal';
}) => {
    const {
        deal: { cycle, prices },
        currency,
    } = useDealContext();

    if (sentenceSaveType === undefined && sentence === undefined) {
        return;
    }

    if (sentence) {
        return <div className="mb-4 text-semibold">{sentence}</div>;
    }

    const { withCoupon = 0, withoutCouponMonthly = 0 } = prices || {};

    const savedAmount = (
        <Price currency={currency} key="saved-amount-key">
            {withoutCouponMonthly * cycle - withCoupon}
        </Price>
    );

    let sentenceSave;

    switch (sentenceSaveType) {
        case 'switch-yearly':
            sentenceSave = c('BF2025: Offers').jt`Switch to our yearly plan and save ${savedAmount}!`;
            break;
        case 'switch-two-year':
            sentenceSave = c('BF2025: Offers').jt`Switch to our 2-year plan and save ${savedAmount}!`;
            break;
        case 'limited-time-deal':
            sentenceSave = c('BF2025: Offers').jt`Save ${savedAmount} with our best-value, limited-time deal!`;
            break;
    }

    return <div className="mb-4 text-semibold">{sentenceSave}</div>;
};

export default DealSaveSentence;
