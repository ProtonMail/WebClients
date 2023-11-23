import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import { OfferProps } from '../../interface';

interface Props extends OfferProps {
    children: ReactNode;
}

const OfferLayout = ({ children, offer }: Props) => {
    const hasMultipleDeals = offer?.deals?.length > 1;
    const hasFourDeals = offer?.deals?.length > 3;
    const { sideImage, sideImage2x, bannerImage, bannerImage2x } = offer?.images || {};
    return (
        <div
            className={clsx(
                'offer-main-wrapper',
                !hasMultipleDeals && 'offer-main-wrapper--left-banner flex flex-row flex-nowrap',
                hasFourDeals && 'offer-main-wrapper--four-plans'
            )}
        >
            {hasMultipleDeals ? null : (
                <div className="offer-side-image-container hidden md:flex no-scroll relative">
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
                    !hasMultipleDeals && 'flex-item-fluid px-0 sm:px-4 md:px-6'
                )}
            >
                {hasMultipleDeals ? (
                    <div className="offer-top-banner-container text-center mb-4 hidden md:flex">
                        {/* if viewport is higher than 990 px (image size), we'll use the 2x version for a proper display */}
                        <picture>
                            <source media="(min-width: 61.875em)" srcSet={`${bannerImage2x}`} />
                            <img
                                className="offer-top-banner w-full"
                                src={bannerImage}
                                srcSet={`${bannerImage}, ${bannerImage2x} 2x`}
                                alt=""
                            />
                        </picture>
                    </div>
                ) : null}
                <div className={clsx('offer-main-content', hasMultipleDeals ? 'pt-6 md:pt-0' : 'pt-6')}>{children}</div>
            </div>
        </div>
    );
};

export default OfferLayout;
