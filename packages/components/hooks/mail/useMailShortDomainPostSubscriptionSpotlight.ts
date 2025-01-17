import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';

enum MAIL_SHORT_DOMAIN_SPOTLIGHT_VALUES {
    /** Not visible, can't be displayed to user */
    DEFAULT = 'DEFAULT',
    /** Ready to be viewed by user */
    ACTIVE = 'ACTIVE',
    /** User saw the spotlight */
    VIEWED = 'VIEWED',
}

const useMailShortDomainPostSubscriptionComposerSpotlight = () => {
    const shortDomainSpotlightFlag = useFeature<MAIL_SHORT_DOMAIN_SPOTLIGHT_VALUES>(
        FeatureCode.PostSubscriptionShortDomainSpotlight
    );

    return {
        canDisplay: MAIL_SHORT_DOMAIN_SPOTLIGHT_VALUES.ACTIVE === shortDomainSpotlightFlag.feature?.Value,
        hasViewed: MAIL_SHORT_DOMAIN_SPOTLIGHT_VALUES.VIEWED === shortDomainSpotlightFlag.feature?.Value,
        setViewed: () => shortDomainSpotlightFlag.update(MAIL_SHORT_DOMAIN_SPOTLIGHT_VALUES.VIEWED),
        setActive: () => shortDomainSpotlightFlag.update(MAIL_SHORT_DOMAIN_SPOTLIGHT_VALUES.ACTIVE),
        loading: shortDomainSpotlightFlag.loading,
    };
};

export default useMailShortDomainPostSubscriptionComposerSpotlight;
