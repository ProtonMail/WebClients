const RESTRICTED_PROPERTIES = new Set(['contentWindow', 'contentDocument']);

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow direct access to iframe.contentWindow/contentDocument. Use getIframeDocument(iframe) instead, which safely returns null for cross-origin/navigated frames.',
        },
        schema: [],
        messages: {
            noDirectAccess:
                "Do not access '{{property}}' directly, it can throw or be stale when the frame has navigated cross-origin. Use getIframeDocument(iframe) instead.",
        },
    },
    create(context) {
        return {
            MemberExpression(node) {
                if (node.property.type === 'Identifier' && RESTRICTED_PROPERTIES.has(node.property.name)) {
                    context.report({
                        node: node.property,
                        messageId: 'noDirectAccess',
                        data: { property: node.property.name },
                    });
                }
            },
        };
    },
};
