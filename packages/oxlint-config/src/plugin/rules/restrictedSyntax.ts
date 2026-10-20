import type { ESTree } from '@oxlint/plugins';
import { defineRule } from '@oxlint/plugins';

import { getRuleOptions } from '../utils/ruleOptions.ts';

type RestrictedSelector = string | { selector: string; message?: string };

/**
 * Port of ESLint's `no-restricted-syntax`: reports every node matching one of the configured
 * AST selectors, with the selector's custom message when one is given.
 */
export default defineRule({
    meta: {
        type: 'suggestion',
        docs: { description: 'Disallow specified syntax' },
        messages: {
            restrictedSyntax: '{{message}}',
        },
        schema: {
            type: 'array',
            items: {
                oneOf: [
                    { type: 'string' },
                    {
                        type: 'object',
                        properties: { selector: { type: 'string' }, message: { type: 'string' } },
                        required: ['selector'],
                        additionalProperties: false,
                    },
                ],
            },
            uniqueItems: true,
        },
    },
    create(context) {
        const messagesBySelector = new Map<string, string[]>();
        for (const option of getRuleOptions<readonly RestrictedSelector[]>(context)) {
            const { selector, message } =
                typeof option === 'string' ? { selector: option, message: undefined } : option;
            const messages = messagesBySelector.get(selector) ?? [];
            messages.push(message ?? `Using '${selector}' is not allowed.`);
            messagesBySelector.set(selector, messages);
        }

        const visitor: Record<string, (node: ESTree.Node) => void> = {};
        for (const [selector, messages] of messagesBySelector) {
            visitor[selector] = (node) => {
                for (const message of messages) {
                    context.report({ node, messageId: 'restrictedSyntax', data: { message } });
                }
            };
        }
        return visitor;
    },
});
