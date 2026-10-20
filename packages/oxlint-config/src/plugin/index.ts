import { definePlugin } from '@oxlint/plugins';

import enforceUint8ArrayArrayBuffer from './rules/enforceUint8ArrayArrayBuffer.ts';
import namingConvention from './rules/namingConvention.ts';
import noExtraneousDependencies from './rules/noExtraneousDependencies.ts';
import restrictedImports from './rules/restrictedImports.ts';
import restrictedSyntax from './rules/restrictedSyntax.ts';

export default definePlugin({
    meta: { name: 'proton' },
    rules: {
        'enforce-uint8array-arraybuffer': enforceUint8ArrayArrayBuffer,
        'naming-convention': namingConvention,
        'no-extraneous-dependencies': noExtraneousDependencies,
        'restricted-imports': restrictedImports,
        'restricted-syntax': restrictedSyntax,
    },
});
