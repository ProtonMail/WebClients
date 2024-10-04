import type { ReactNode } from 'react';

import blackFridayImg from '@proton/styles/assets/img/promotions/bf.svg';
import protonLogoImg from '@proton/styles/assets/img/promotions/proton.svg';
import clsx from '@proton/utils/clsx';

import type { OfferProps } from '../../interface';

import './OfferLayoutBF2024.scss';

interface Props extends OfferProps {
    children: ReactNode;
}

const OfferLayoutBF = ({ children, offer }: Props) => {
    const hasMultipleDeals = offer?.deals?.length > 1;
    const has3Deals = offer?.deals?.length > 2;
    const hideDealTitle = offer?.hideDealTitle;
    return (
        <>
            <div className="flex text-center mt-6 md:mt-10 flex-nowrap">
                <h1
                    className={clsx([
                        'inline-flex flex-nowrap mx-auto gap-2 flex-column',
                        hasMultipleDeals && 'md:flex-row',
                    ])}
                >
                    <div className="flex">
                        <img src={protonLogoImg} alt="Proton" className="mx-auto" />
                    </div>
                    <div className="flex">
                        <img src={blackFridayImg} alt="Black Friday" className="mx-auto" />
                    </div>
                </h1>
            </div>

            <div
                className={clsx(
                    'offer-main-wrapper',
                    hideDealTitle && 'offer-main-wrapper--no-deal-title',
                    has3Deals && 'offer-main-wrapper--3deals'
                )}
            >
                <div
                    className={clsx('offer-main-content-container', !hasMultipleDeals && 'flex-1 px-0 sm:px-4 md:px-6')}
                >
                    <div className="offer-main-content">{children}</div>
                </div>
            </div>
        </>
    );
};

export default OfferLayoutBF;
