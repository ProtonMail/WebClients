/** @type {import('eslint').Rule.RuleModule} */
const noDirectElectronStoreAccess = {
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
        const isElectronStore = (value) =>
            typeof value === "string" && (value === "electron-store" || value.startsWith("electron-store/"));
        const check = (node, source) => {
            if (source && isElectronStore(source.value)) {
                context.report({ node, messageId: "noDirectImport" });
            }
        };

        return {
            ImportDeclaration: (node) => check(node, node.source),
            ExportNamedDeclaration: (node) => check(node, node.source),
            ExportAllDeclaration: (node) => check(node, node.source),
            ImportExpression: (node) => check(node, node.source),
            CallExpression: (node) => {
                if (node.callee.type === "Identifier" && node.callee.name === "require") {
                    check(node, node.arguments[0]);
                }
            },
        };
    },
};

export default {
    meta: { name: "inbox-desktop" },
    rules: { "no-direct-electron-store-access": noDirectElectronStoreAccess },
};
