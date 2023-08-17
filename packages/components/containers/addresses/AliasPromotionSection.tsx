import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import ButtonLike from '@proton/atoms/Button/ButtonLike';
import { Icon } from '@proton/components/components/icon';
import useFeature from '@proton/components/hooks/useFeature';
import useUser from '@proton/components/hooks/useUser';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import { FeatureCode } from '../features/FeaturesContext';

import './AliasPromotionSection.scss';

const AliasPromotionSection = () => {
    const [user] = useUser();
    const { feature, loading, update } = useFeature(FeatureCode.AliasPromotion);

    const title = user.hasPaidMail
        ? c('Alias promotion').t`Get unlimited aliases!`
        : c('Alias promotion').t`Get 10 aliases for free!`;

    if (loading || !feature || !feature.Value) {
        return null;
    }

    const handleClose = () => {
        void update(false);
    };

    return (
        <>
            <div className="relative">
                <Button shape="ghost" icon className="absolute right top mr-2 mt-2" onClick={handleClose}>
                    <Icon name="cross-big" />
                </Button>
            </div>
            <div className="flex flex-column flex-align-items-center text-center rounded-lg p-6 alias-promotion-section">
                <h2 className="text-bold text-xl mb-2">{title}</h2>
                <p className="mt-0 mb-4 max-w70ch">
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
