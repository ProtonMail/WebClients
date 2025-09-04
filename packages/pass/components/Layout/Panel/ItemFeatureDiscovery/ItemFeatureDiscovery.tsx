import { type ComponentType, type FC, memo } from 'react';

import { FileAttachmentsDiscovery } from '@proton/pass/components/Layout/Panel/ItemFeatureDiscovery/FileAttachmentsDiscovery';
import type { ItemType } from '@proton/pass/types';

type FeatureDiscovery = { component: ComponentType; types: ItemType[] };
type Props = { type: ItemType };

const discoveries: FeatureDiscovery[] = [
    { component: FileAttachmentsDiscovery, types: ['login', 'identity', 'creditCard'] },
];

export const ItemFeatureDiscovery: FC<Props> = memo(({ type }) => (
    <div>
        {discoveries
            .filter(({ types }) => types.includes(type))
            .map(({ component: FeatureDiscovery }) => (
                <FeatureDiscovery key={FeatureDiscovery.name} />
            ))}
    </div>
));

ItemFeatureDiscovery.displayName = 'ItemFeatureDiscoveryMemo';
