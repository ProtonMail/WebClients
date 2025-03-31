import type { FC } from 'react';

import { FileAttachmentsDiscovery } from '@proton/pass/components/Layout/Panel/ItemFeatureDiscovery/FileAttachmentsDiscovery';

const discoveries = [FileAttachmentsDiscovery];

export const ItemFeatureDiscovery: FC = () => (
    <div>
        {discoveries.map((FeatureDiscovery) => (
            <FeatureDiscovery key={FeatureDiscovery.name} />
        ))}
    </div>
);
