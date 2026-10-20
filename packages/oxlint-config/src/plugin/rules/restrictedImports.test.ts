import { RuleTester } from 'oxlint/plugins-dev';

import rule from './restrictedImports.ts';

const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const tsxLanguageOptions = { parserOptions: { lang: 'tsx' as const } };

const appFile = '/repo/applications/account/src/app/Thing.ts';
const appComponentFile = '/repo/applications/account/src/app/Thing.tsx';
const driveAppFile = '/repo/applications/drive/src/app/Thing.ts';

const somePackagePath = { name: 'some-package', message: 'Use other-package instead.' };
const oldHelperPath = { name: 'old-helpers', importNames: ['oldHelper'], message: 'Use newHelper.' };
const storeTypesPattern = { group: ['**/store/store'], allowTypeImports: true, message: 'Types only.' };
const acmePattern = { group: ['@acme/lib/*', '!@acme/lib/public'], message: 'Only /public is importable.' };

const additions = [{ paths: [somePackagePath, oldHelperPath], patterns: [storeTypesPattern, acmePattern] }];

ruleTester.run('restricted-imports: matching client additions', rule, {
    valid: [
        { code: `import thing from 'some-package/thing';`, options: additions },
        { code: `import { newHelper } from 'old-helpers';`, options: additions },
        { code: `import 'old-helpers';`, options: additions },
        { code: `import { thing } from '@acme/lib/public';`, options: additions },
        { code: `import type { RootState } from '../store/store';`, options: additions },
        { code: `import { type RootState } from '../store/store';`, options: additions },
        { code: `export type { RootState } from '../store/store';`, options: additions },
    ],
    invalid: [
        {
            code: `import thing from 'some-package';`,
            options: additions,
            errors: [
                {
                    messageId: 'path',
                    data: { importSource: 'some-package', customMessage: ' Use other-package instead.' },
                },
            ],
        },
        {
            code: `export * from 'some-package';`,
            options: additions,
            errors: [{ messageId: 'path' }],
        },
        {
            code: `import { oldHelper, newHelper } from 'old-helpers';`,
            options: additions,
            errors: [
                {
                    messageId: 'importName',
                    data: { importName: 'oldHelper', importSource: 'old-helpers', customMessage: ' Use newHelper.' },
                },
            ],
        },
        {
            code: `export { oldHelper } from 'old-helpers';`,
            options: additions,
            errors: [{ messageId: 'importName' }],
        },
        {
            code: `import * as helpers from 'old-helpers';`,
            options: additions,
            errors: [
                {
                    messageId: 'everything',
                    data: { importNames: 'oldHelper', importSource: 'old-helpers', customMessage: ' Use newHelper.' },
                },
            ],
        },
        {
            code: `import thing from '@acme/lib/internal';`,
            options: additions,
            errors: [
                {
                    messageId: 'patterns',
                    data: { importSource: '@acme/lib/internal', customMessage: ' Only /public is importable.' },
                },
            ],
        },
        {
            code: `import thing from '@ACME/LIB/internal';`,
            options: additions,
            errors: [{ messageId: 'patterns' }],
        },
        {
            code: `import { store } from '../store/store';`,
            options: additions,
            errors: [{ messageId: 'patterns' }],
        },
        {
            code: `import { type RootState, store } from '../store/store';`,
            options: additions,
            errors: [{ messageId: 'patterns' }],
        },
    ],
});

ruleTester.run('restricted-imports: base restrictions', rule, {
    valid: [
        { code: `import { Button } from '@proton/atoms/Button/Button';`, filename: appFile },
        { code: `import drive from '@proton/drive';`, filename: appFile },
        { code: `import drive from '@proton/drive/index';`, filename: appFile },
        { code: `import { Thing } from '@proton/drive/public/thing';`, filename: appFile },
        { code: `import thing from '@proton/drive/internal/thing';`, filename: driveAppFile },
        { code: `import { createStructuredSelector } from 'reselect';`, filename: appFile },
        { code: `import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';`, filename: appFile },
        { code: `import type { DebouncedFunc } from 'lodash';`, filename: appFile },
        { code: `import debounce from 'lodash/debounce';`, filename: appFile },
    ],
    invalid: [
        {
            code: `import { Button } from '@proton/atoms';`,
            filename: appFile,
            errors: [{ messageId: 'path' }],
        },
        {
            code: `import { Button } from '@proton/atoms/index';`,
            filename: appFile,
            errors: [{ messageId: 'path' }],
        },
        {
            code: `import styles from '@proton/styles';`,
            filename: appFile,
            errors: [{ messageId: 'path' }],
        },
        {
            code: `import { createSelector } from 'reselect';`,
            filename: appFile,
            errors: [
                {
                    messageId: 'importName',
                    data: {
                        importName: 'createSelector',
                        importSource: 'reselect',
                        customMessage: ' Please use createSelector from @redux/toolkit instead.',
                    },
                },
            ],
        },
        {
            code: `import { wait } from '../../../../packages/shared/lib/helpers/promise';`,
            filename: appFile,
            errors: [{ messageId: 'patterns' }],
        },
        {
            code: `import thing from '@proton/drive/internal/thing';`,
            filename: appFile,
            errors: [
                {
                    messageId: 'patterns',
                    data: {
                        importSource: '@proton/drive/internal/thing',
                        customMessage:
                            ' Only `@proton/drive` (index) and `@proton/drive/public/*` are public and importable.',
                    },
                },
            ],
        },
        {
            code: `import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';`,
            filename: appComponentFile,
            languageOptions: tsxLanguageOptions,
            errors: [{ messageId: 'importNameWithPattern' }],
        },
        {
            code: `import { debounce } from 'lodash';`,
            filename: appFile,
            errors: [
                {
                    messageId: 'path',
                    data: {
                        importSource: 'lodash',
                        customMessage: ' Import each lodash method from its own module, e.g. `lodash/debounce`.',
                    },
                },
            ],
        },
    ],
});

ruleTester.run('restricted-imports: rollout restrictions', rule, {
    valid: [
        { code: `import { Button } from '@proton/components';`, filename: appFile },
        { code: `import { Icon } from '@proton/components';`, filename: appFile },
        {
            code: `import { Button } from '@proton/components';`,
            filename: appFile,
            options: [{ rollout: ['components-barrel-index'] }],
        },
    ],
    invalid: [
        {
            code: `import { Button } from '@proton/components';`,
            filename: appFile,
            options: [{ rollout: ['components-barrel'] }],
            errors: [{ messageId: 'path' }],
        },
        {
            code: `import { Button } from '@proton/components/index';`,
            filename: appFile,
            options: [{ rollout: ['components-barrel-index'] }],
            errors: [{ messageId: 'path' }],
        },
        {
            code: `import Icon from '@proton/components/components/icon/Icon';`,
            filename: appFile,
            options: [{ rollout: ['icon-component'] }],
            errors: [{ messageId: 'path' }],
        },
        {
            code: `import { Icon, Button } from '@proton/components';`,
            filename: appFile,
            options: [{ rollout: ['icon-component'] }],
            errors: [{ messageId: 'importName' }],
        },
    ],
});
