import { forwardRef } from 'react';

import { OfferProps } from '../../interface';
import OfferCountdown from './OfferCountdown';

interface Props extends OfferProps {
    children: React.ReactNode;
}

const OfferHeader = forwardRef<HTMLDivElement, Props>(({ children, offer }, ref) => (
    <header ref={ref}>
        {children}
        {offer.periodEnd !== undefined && <OfferCountdown periodEnd={offer.periodEnd} />}
    </header>
));

OfferHeader.displayName = 'OfferHeader';

export default OfferHeader;
