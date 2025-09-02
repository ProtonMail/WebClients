import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { useSpotlightOnFeature, useSpotlightShow } from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

import { useCategoryViewExperiment } from './useCategoryViewExperiment';

export const CategoryBadgeSpotlightContent = () => {
    return (
        <>
            <div className="flex flex-nowrap items-start mb-1 gap-4">
                <div className="shrink-0">
                    <img alt="" src={spotlightImg} className="w-custom" style={{ '--w-custom': '2.75rem' }} />
                </div>
                <div className="flex flex-column flex-nowrap items-start">
                    <p className="text-lg text-bold m-0 mb-1">{c('Title').t`✨ Categories are coming!`}</p>
                    <p className="m-0">{c('Label')
                        .t`Help us improve categories by choosing the one that best fits this email. Thanks for your help!`}</p>
                </div>
            </div>
        </>
    );
};

export const useCategoryBadgeSpotlight = () => {
    const {
        welcomeFlags: { isWelcomeFlow },
    } = useWelcomeFlags();

    const { canSeeCategoryLabel } = useCategoryViewExperiment();

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.CategoryViewBadgeSpotlight,
        !isWelcomeFlow && canSeeCategoryLabel
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    return {
        shouldShowSpotlight,
        onDisplayed,
        onClose,
    };
};
