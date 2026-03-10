import { Fragment } from 'react';

import { Vr } from '@proton/atoms/Vr/Vr';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

import FeatureItem from '../../../../single-signup-v2/FeatureItem';
import { getGenericFeatures } from '../../../../single-signup-v2/configuration/helper';

const BornPrivateFeatures = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const features = getGenericFeatures(viewportWidth['>=large']);

    return (
        <div className="flex flex-nowrap mb-4 gap-1 md:gap-8 text-sm md:text-rg">
            {features.map(({ key, left, text }, i) => {
                return (
                    <Fragment key={key}>
                        <FeatureItem left={left} text={text} />
                        {i !== features.length - 1 && (
                            <Vr className="min-h-custom" style={{ '--min-h-custom': '2.25rem' }} />
                        )}
                    </Fragment>
                );
            })}
        </div>
    );
};
export default BornPrivateFeatures;
