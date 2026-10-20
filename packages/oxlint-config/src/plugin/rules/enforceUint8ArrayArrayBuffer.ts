import { defineRule } from '@oxlint/plugins';

/**
 * Port of `@protontech/eslint-plugin-enforce-uint8array-arraybuffer`. Every `Uint8Array` type must
 * spell out `Uint8Array<ArrayBuffer>`: since TypeScript 5.9 the default `ArrayBufferLike` is no
 * longer assignable to `ArrayBuffer`, which WebCrypto and Blob require.
 * See https://github.com/microsoft/TypeScript/pull/59417. Values (`new Uint8Array()`,
 * `Uint8Array.from()`) are not type references, so they are not affected.
 */
export default defineRule({
    meta: {
        type: 'problem',
        docs: {
            description:
                'Enforce that any Uint8Array type declaration explicitly defines ArrayBuffer as its generic argument.',
        },
        fixable: 'code',
        messages: {
            missingGeneric: 'Uint8Array must be used as Uint8Array<ArrayBuffer>.',
            wrongGeneric: "Uint8Array generic argument must be exactly 'ArrayBuffer'.",
        },
        schema: [],
    },
    create(context) {
        return {
            TSTypeReference(node) {
                if (node.typeName.type !== 'Identifier' || node.typeName.name !== 'Uint8Array') {
                    return;
                }
                const [typeArgument] = node.typeArguments?.params ?? [];
                if (!typeArgument) {
                    context.report({
                        node,
                        messageId: 'missingGeneric',
                        fix: (fixer) => fixer.insertTextAfter(node.typeName, '<ArrayBuffer>'),
                    });
                    return;
                }
                const isArrayBuffer =
                    typeArgument.type === 'TSTypeReference' &&
                    typeArgument.typeName.type === 'Identifier' &&
                    typeArgument.typeName.name === 'ArrayBuffer';
                if (!isArrayBuffer) {
                    context.report({ node: typeArgument, messageId: 'wrongGeneric' });
                }
            },
        };
    },
});
