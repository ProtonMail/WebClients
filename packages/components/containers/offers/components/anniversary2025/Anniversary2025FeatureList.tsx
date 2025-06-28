import Icon from '@proton/components/components/icon/Icon';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';

import type { OfferProps } from '../../interface';

const Anniversary2025FeatureList = (props: OfferProps) => {
    const features = props.offer.deals[0].features?.() || [];

    if (!features.length) {
        return null;
    }

    return (
        <StripedList alternate="even" className="my-4 mb-6">
            {features.map((feature) => (
                <StripedItem key={feature.name} left={<Icon name="checkmark" />} rightAlignedTooltip>
                    {feature.name}
                </StripedItem>
            ))}
        </StripedList>
    );
};

export default Anniversary2025FeatureList;
