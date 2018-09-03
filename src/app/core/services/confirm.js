/* @ngInject */
function confirm(confirmModal) {
    return ({ params }) =>
        new Promise((resolve) => {
            const resolver = (value) => () => confirmModal.deactivate().then(() => resolve(value));

            confirmModal.activate({
                params: {
                    ...params,
                    confirm: resolver(true),
                    cancel: resolver(false)
                }
            });
        });
}
export default confirm;
