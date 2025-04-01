import type { API, FileInfo, Options } from 'jscodeshift';

import moveLiteral, { type ImportConfig } from '../move-literal';

function transform(fileInfo: FileInfo, api: API, options: Options) {
    const config: ImportConfig[] = [
        {
            identifier: 'Offer',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'Plan',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'StrictPlan',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'Addon',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'FreePlanDefault',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'SubscriptionPlan',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'BasePlansMap',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'PlansMap',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
    ];

    return moveLiteral(fileInfo, api, config, options);
}

transform.parser = 'tsx';

export default transform;
