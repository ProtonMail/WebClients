import { forwardRef } from 'react';

import { useUser } from '@proton/account/user/hooks';
import CurrencySelector from '@proton/components/containers/payments/CurrencySelector';
import { mainCurrencies } from '@proton/payments';

import type { OfferProps } from '../../interface';
import OfferDisableButton from './OfferDisableButton';

interface Props extends OfferProps {
    children?: React.ReactNode;
}

const OfferFooter = forwardRef<HTMLDivElement, Props>((props, ref) => {
    const { children, currency, onChangeCurrency } = props;
    const [user] = useUser();

    return (
        <footer ref={ref}>
            {user.isFree ? (
                <div className="my-4 text-center offers-currency-selector">
                    <CurrencySelector
                        // essentially, that's a placeholder. If/when you need the regional currencies in offers,
                        // then it should be extended
                        currencies={mainCurrencies}
                        id="offers-currency-selector"
                        mode="buttons"
                        currency={currency}
                        onSelect={onChangeCurrency}
                    />
                </div>
            ) : null}
            {children}
            {props.offer.canBeDisabled ? (
                <div className="mb-4 text-center">
                    <OfferDisableButton {...props} />
                </div>
            ) : null}
        </footer>
    );
});

OfferFooter.displayName = 'OfferFooter';

export default OfferFooter;
