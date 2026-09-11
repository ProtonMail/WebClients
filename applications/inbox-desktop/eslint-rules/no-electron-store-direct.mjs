/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow importing/requiring electron-store directly. Use SafeStore instead.",
        },
        schema: [],
        messages: {
            noDirectImport: "Do not import 'electron-store' directly. Use SafeStore from store/safeStore instead.",
        },
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                if (node.source.value === "electron-store") {
                    context.report({ node, messageId: "noDirectImport" });
                }
            },
        };
    },
};
