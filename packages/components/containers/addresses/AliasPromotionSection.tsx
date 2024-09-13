import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ButtonLike from '@proton/atoms/Button/ButtonLike';
import { Icon } from '@proton/components/components/icon';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/helpers/subscription';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import { FeatureCode } from '../../containers';
import useFeature from '../../hooks/useFeature';
import { useSubscription } from '../../hooks/useSubscription';
import useUser from '../../hooks/useUser';

import './AliasPromotionSection.scss';

const AliasPromotionSection = () => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { feature, loading, update } = useFeature(FeatureCode.AliasPromotion);

    const title = user.hasPaidMail
        ? c('Alias promotion').t`Get unlimited aliases!`
        : c('Alias promotion').t`Get 10 aliases for free!`;

    if (
        loading ||
        !feature ||
        !feature.Value ||
        !subscription ||
        !subscription.Plans ||
        user.hasPaidPass ||
        getIsB2BAudienceFromPlan(subscription.Plans[0].Name) // Exclude B2B users
    ) {
        return null;
    }

    const handleClose = () => {
        void update(false);
    };

    return (
        <>
            <div className="relative">
                <Button shape="ghost" icon className="absolute right-0 top-0 mr-2 mt-2" onClick={handleClose}>
                    <Icon name="cross-big" />
                </Button>
            </div>
            <div className="flex flex-column items-center text-center rounded-lg p-6 alias-promotion-section">
                <h2 className="text-bold text-xl mb-2">{title}</h2>
                <p className="mt-0 mb-4 max-w-custom" style={{ '--max-w-custom': '70ch' }}>
                    {/* translator: With Proton Pass you can generate unique aliases to hide your identity and forward emails to your main inbox. */}
                    {c('Alias promotion')
                        .t`With ${PASS_APP_NAME} you can generate unique aliases to hide your identity and forward emails to your main inbox.`}
                </p>
                <ButtonLike color="norm" as="a" href={getStaticURL('/pass/download')} target="_blank">
                    {/* translator: Try Proton Pass */}
                    {c('Alias promotion').t`Try ${PASS_APP_NAME}`}
                </ButtonLike>
            </div>
        </>
    );
};

export default AliasPromotionSection;
