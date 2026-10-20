import { RuleTester } from 'oxlint/plugins-dev';

import rule from './enforceUint8ArrayArrayBuffer.ts';

const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });

ruleTester.run('enforce-uint8array-arraybuffer', rule, {
    valid: [
        { code: 'let bytes: Uint8Array<ArrayBuffer>;' },
        { code: 'const bytes = new Uint8Array(4);' },
        { code: 'const bytes = Uint8Array.from([1, 2]);' },
        { code: 'function read(): Promise<Uint8Array<ArrayBuffer>> { return load(); }' },
        { code: 'let other: Uint16Array;' },
    ],
    invalid: [
        {
            code: 'let bytes: Uint8Array;',
            output: 'let bytes: Uint8Array<ArrayBuffer>;',
            errors: [{ messageId: 'missingGeneric' }],
        },
        {
            code: 'function read(): Promise<Uint8Array> { return load(); }',
            output: 'function read(): Promise<Uint8Array<ArrayBuffer>> { return load(); }',
            errors: [{ messageId: 'missingGeneric' }],
        },
        {
            code: 'let bytes: Uint8Array<ArrayBufferLike>;',
            errors: [{ messageId: 'wrongGeneric' }],
        },
        {
            code: 'let bytes: Uint8Array<SharedArrayBuffer>;',
            errors: [{ messageId: 'wrongGeneric' }],
        },
    ],
});
