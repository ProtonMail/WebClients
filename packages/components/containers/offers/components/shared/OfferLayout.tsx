import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import { OfferProps } from '../../interface';

interface Props extends OfferProps {
    children: ReactNode;
}

const OfferLayout = ({ children, offer }: Props) => {
    const hasMultipleDeals = offer?.deals?.length > 1;
    const { sideImage, sideImage2x, bannerImage, bannerImage2x } = offer?.images || {};
    return (
        <div
            className={clsx(
                'offer-main-wrapper',
                !hasMultipleDeals && 'offer-main-wrapper--left-banner flex flex-row flex-nowrap'
            )}
        >
            {hasMultipleDeals ? null : (
                <div className="offer-side-image-container no-mobile no-scroll relative">
                    <picture>
                        <source
                            media="(-webkit-min-device-pixel-ratio: 1.25), min-resolution: 1.25dppx"
                            srcSet={`${sideImage2x}`}
                        />
                        <img
                            className="offer-side-image absolute absolute-center-y"
                            src={sideImage}
                            srcSet={`${sideImage}, ${sideImage2x} 2x`}
                            alt=""
                        />
                    </picture>
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

export default OfferLayout;
