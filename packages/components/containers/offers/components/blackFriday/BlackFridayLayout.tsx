import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import { OfferProps } from '../../interface';
import sideImage from './images/bf-mail-40-halfpage.jpg';
import sideImage2x from './images/bf-mail-40-halfpage@2x.jpg';
// temporary for dev
import bannerImage from './images/bf-mail-40-landscape.jpg';
import bannerImage2x from './images/bf-mail-40-landscape@2x.jpg';

interface Props extends OfferProps {
    children: ReactNode;
}

const BlackFridayLayout = ({ children, offer }: Props) => {
    const hasMultipleDeals = offer?.deals?.length > 1;
    return (
        <div
            className={clsx(
                'offer-main-wrapper',
                !hasMultipleDeals && 'offer-main-wrapper--left-banner flex flex-row flex-nowrap'
            )}
        >
            {hasMultipleDeals ? null : (
                <div className="offer-side-image-container no-mobile no-scroll relative">
                    <img
                        className="offer-side-image absolute absolute-center-y"
                        src={sideImage}
                        srcSet={`${sideImage}, ${sideImage2x} 2x`}
                        alt=""
                    />
                </div>
            )}
            <div
                className={clsx(
                    'offer-main-content-container',
                    !hasMultipleDeals && 'flex-item-fluid px2 on-mobile-px1 on-tiny-mobile-px0'
                )}
            >
                {hasMultipleDeals ? (
                    <div className="offer-top-banner-container text-center mb1 no-mobile">
                        {/* if viewport is higher than 990 px (image size), we'll use the 2x version for a proper display */}
                        <picture>
                            <source media="(min-width: 61.875em)" srcSet={`${bannerImage2x}`} />
                            <img
                                className="offer-top-banner w100"
                                src={bannerImage}
                                srcSet={`${bannerImage}, ${bannerImage2x} 2x`}
                                alt=""
                            />
                        </picture>
                    </div>
                ) : null}
                <div className={clsx('offer-main-content on-mobile-pt2', !hasMultipleDeals && 'pt2')}>{children}</div>
            </div>
        </div>
    );
};

export default BlackFridayLayout;
