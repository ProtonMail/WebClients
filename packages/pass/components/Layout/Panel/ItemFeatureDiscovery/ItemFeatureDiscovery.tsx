import { type ComponentType, memo } from 'react';

import type { ItemType } from '../../../../types';
import { FileAttachmentsDiscovery } from './FileAttachmentsDiscovery';

type FeatureDiscovery = { component: ComponentType; types: ItemType[] };
type Props = { type: ItemType };

const discoveries: FeatureDiscovery[] = [
    { component: FileAttachmentsDiscovery, types: ['login', 'identity', 'creditCard'] },
];

export const ItemFeatureDiscovery = memo(({ type }: Props) => (
    <div>
        {discoveries
            .filter(({ types }) => types.includes(type))
            .map(({ component: FeatureDiscovery }) => (
                <FeatureDiscovery key={FeatureDiscovery.name} />
            ))}
    </div>
));

ItemFeatureDiscovery.displayName = 'ItemFeatureDiscoveryMemo';
