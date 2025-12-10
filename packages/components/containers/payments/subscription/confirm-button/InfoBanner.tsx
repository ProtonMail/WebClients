import type { PropsWithChildren } from 'react';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';

export const InfoBanner = ({ children, variant }: PropsWithChildren & { variant?: BannerVariants }) => {
    return (
        <Banner className="mt-2 mb-4" variant={variant ?? BannerVariants.INFO}>
            {children}
        </Banner>
    );
};
