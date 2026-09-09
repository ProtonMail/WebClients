import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';

const AwaitingTouchBanner = () => {
    return (
        <Banner variant={BannerVariants.INFO} noIcon className="my-4 fade-in">
            <h2 className="text-rg text-semibold">{c('fido2: Info').t`Still waiting?`}</h2>
            <p className="m-0">{c('fido2: Info').t`Touch your security key to continue.`}</p>
        </Banner>
    );
};

export default AwaitingTouchBanner;
