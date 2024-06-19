import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

const getFeatures = (): PlanCardFeatureDefinition[] => {
    const features = [
        { key: 'allProtonServices', text: c('new_plans: feature').t`All ${BRAND_NAME} services` },
        { key: 'tailored', text: c('new_plans: feature').t`Tailored to your needs` },
        { key: 'accountManager', text: c('new_plans: feature').t`Dedicated account manager` },
    ];
    return features.map((feature) => ({
        text: feature.text,
        included: true,
    }));
};

const LetsTalkGenericSubSection = () => {
    return (
        <div className="flex flex-column gap-4 w-full">
            <div className="text-left text-sm">
                {c('pass_signup_2023: Info').t`Customizable services for large teams.`}
            </div>
            <ButtonLike
                as="a"
                shape="outline"
                color="norm"
                fullWidth
                pill
                href={getStaticURL('/business/contact?pd=mail&int=demo')}
                target="_blank"
            >
                {c('signup: Action').t`Request a demo`}
            </ButtonLike>

            <PlanCardFeatureList
                odd={false}
                margin={false}
                iconSize={4}
                tooltip={false}
                className="text-sm gap-1"
                itemClassName="color-weak"
                features={getFeatures()}
            />
        </div>
    );
};

export default LetsTalkGenericSubSection;
