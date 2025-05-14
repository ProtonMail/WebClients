import { c } from 'ttag';

import protonAnniversary from '@proton/styles/assets/img/illustrations/proton-anniversary.svg';

import type { OfferProps } from '../../interface';

const Anniversary2025Header = (props: OfferProps) => {
    const { title } = props.offer;

    return (
        <header className="mb-6">
            <div className="flex flex-nowrap flex-row items-end gap-3 mb-2">
                <img src={protonAnniversary} width={108} height={97} alt="11" />
                <h2 className="color-norm lh100 anniversary-2025-header">
                    {
                        // translator: full sentence is: 11 years of privacy thanks to you
                        c('anniversary_2025: Offer').t`years`
                    }{' '}
                    <span className="block text-ellipsis" title={c('anniversary_2025: Offer').t`of privacy`}>{
                        // translator: full sentence is 11 years of privacy thanks to you
                        c('anniversary_2025: Offer').t`of privacy`
                    }</span>{' '}
                    <p className="text-bold m-0 text-ellipsis" title={c('anniversary_2025: Offer').t`thanks to you`}>{
                        // translator: full sentence is: 11 years of privacy thanks to you
                        c('anniversary_2025: Offer').t`thanks to you`
                    }</p>
                </h2>
            </div>
            {title && <p className="my-0">{title()}</p>}
        </header>
    );
};

export default Anniversary2025Header;
