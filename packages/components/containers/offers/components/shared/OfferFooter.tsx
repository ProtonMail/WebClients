import { forwardRef } from 'react';

import { CurrencySelector, useUser } from '@proton/components';

import { OfferProps } from '../../interface';
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
                        id="offers-currency-selector"
                        mode="buttons"
                        currency={currency}
                        onSelect={onChangeCurrency}
                    />
                </div>
            ) : null}
            {props.offer.canBeDisabled ? (
                <div className="mb-4 text-center">
                    <OfferDisableButton {...props} />
                </div>
            ) : null}
            {children}
        </footer>
    );
});

OfferFooter.displayName = 'OfferFooter';

export default OfferFooter;
