import type { API, FileInfo, Options } from 'jscodeshift';

import moveLiteral, { type ImportConfig } from '../move-literal';

function transform(fileInfo: FileInfo, api: API, options: Options) {
    const config: ImportConfig[] = [
        {
            identifier: 'Renew',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'External',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'BillingPlatform',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
        {
            identifier: 'Subscription',
            source: '@proton/shared/lib/interfaces',
            target: '@proton/payments',
        },
    ];

    return moveLiteral(fileInfo, api, config, options);
}

transform.parser = 'tsx';

export default transform;
