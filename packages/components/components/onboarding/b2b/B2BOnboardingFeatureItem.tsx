import { Href } from '@proton/atoms/Href/Href';
import type { B2BOnboardingFeature } from '@proton/components/components/onboarding/b2b/interface';

import Icon from '../../icon/Icon';

interface Props {
    feature: B2BOnboardingFeature;
}

const B2BOnboardingFeatureItem = ({ feature }: Props) => {
    return (
        <div key={feature.id} className="relative flex flex-row flex-nowrap py-4 sm:px-4">
            <img src={feature.illustration} alt="" className="shrink-0 hidden sm:flex" />
            <div className="flex-1 mr-4 sm:ml-4 my-auto">
                <h3 className="text-rg text-semibold">{feature.title}</h3>
                <p className="my-2 text-sm color-weak">{feature.description}</p>
                {feature.kb && (
                    <Href
                        href={feature.kb.link}
                        className="inline-flex flex-nowrap items-start color-weak gap-1 relative z-up"
                    >
                        <Icon name="arrow-out-square" className="mt-0.5" /> {feature.kb.title}
                    </Href>
                )}
            </div>
            <div className="shrink-0 flex items-center justify-center">{feature.cta}</div>
        </div>
    );
};

export default B2BOnboardingFeatureItem;
