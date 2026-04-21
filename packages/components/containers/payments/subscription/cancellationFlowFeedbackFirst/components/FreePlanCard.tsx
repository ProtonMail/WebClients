import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import Price from '@proton/components/components/price/Price';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import type { Currency } from '@proton/payments';

import type { OfferFeature } from '../config/offerConfig';

interface Props {
    features: OfferFeature[];
    currency: Currency;
    onSwitchToFree: () => void;
}

const FreePlanCard = ({ features, currency, onSwitchToFree }: Props) => {
    return (
        <div className="border rounded-xl p-6 h-full flex flex-column flex-1">
            <h2 className="text-2xl text-semibold mb-6">{c('Title').t`Free plan`}</h2>
            <div className="mb-10" style={{ fontSize: '2.75rem' }}>
                <Price
                    currency={currency}
                    amountClassName="color-disabled"
                    currencyClassName="color-disabled"
                    wrapperClassName="inline-flex items-baseline"
                >
                    {0}
                </Price>
            </div>
            <Button shape="outline" color="weak" className="w-full" onClick={onSwitchToFree}>
                {c('Action').t`Switch to free plan`}
            </Button>
            <StripedList alternate="odd">
                {features.map(({ id, icon, text, included }) => {
                    const leftIcon = included ? icon : <Icon name="cross" className="color-danger" />;

                    return (
                        <StripedItem key={id} left={leftIcon}>
                            <span>{text}</span>
                        </StripedItem>
                    );
                })}
            </StripedList>
        </div>
    );
};

export default FreePlanCard;
