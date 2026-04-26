/* eslint-env es6 */

const HOOK_ESCAPE_HATCH = {
    useSubscriptionModal: 'useSubscriptionModalRaw',
    useOptionalSubscriptionModal: 'useOptionalSubscriptionModalRaw',
};

export default {
    meta: {
        docs: {
            description:
                'Warn when the loading value returned by useSubscriptionModal / useOptionalSubscriptionModal is not destructured. openSubscriptionModal now returns a promise that resolves together with the second (loading) return value, so consumers should either destructure that value or opt out via the *WithoutLoading variant and handle the promise manually.',
        },
        schema: [],
        messages: {
            missingLoadingSubscriptionModal:
                '`useSubscriptionModal` now returns `[openSubscriptionModal, loadingSubscriptionModal]`. `openSubscriptionModal()` returns a promise that resolves together with `loadingSubscriptionModal`, so destructure the second value and use it to show a loading indicator. To silence this warning, switch to `useSubscriptionModalRaw` and handle the promise manually.',
            missingLoadingOptionalSubscriptionModal:
                '`useOptionalSubscriptionModal` now returns `[openSubscriptionModal, loadingSubscriptionModal]`. `openSubscriptionModal()` returns a promise that resolves together with `loadingSubscriptionModal`, so destructure the second value and use it to show a loading indicator. To silence this warning, switch to `useOptionalSubscriptionModalRaw` and handle the promise manually.',
        },
    },
    create: (context) => {
        return {
            VariableDeclarator(node) {
                if (!node.init || node.init.type !== 'CallExpression') {
                    return;
                }

                const callee = node.init.callee;
                if (!callee || callee.type !== 'Identifier' || !(callee.name in HOOK_ESCAPE_HATCH)) {
                    return;
                }

                if (node.id.type !== 'ArrayPattern') {
                    return;
                }

                const second = node.id.elements[1];
                if (second) {
                    return;
                }

                const messageId =
                    callee.name === 'useSubscriptionModal'
                        ? 'missingLoadingSubscriptionModal'
                        : 'missingLoadingOptionalSubscriptionModal';

                context.report({
                    node: node.id,
                    messageId,
                });
            },
        };
    },
};
