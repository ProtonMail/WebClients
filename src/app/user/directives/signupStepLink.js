/* @ngInject */
const signupStepLink = (dispatchers, gettextCatalog) => ({
    replace: true,
    template: `<a href="#" class="link signupStepLink-container">${gettextCatalog.getString(
        'Yes',
        null,
        'Action'
    )}</a>`,
    link(scope, el, { value = 1 }) {
        const { dispatcher } = dispatchers(['signup']);
        const onClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatcher.signup('goto.step', { value: +value });
        };

        el.on('click', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
        });
    }
});
export default signupStepLink;
