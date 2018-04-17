/* @ngInject */
const signupStepLink = (gettextCatalog, $rootScope) => ({
    replace: true,
    template: `<a href="#" class="link signupStepLink-container">${gettextCatalog.getString(
        'Yes',
        null,
        'Action'
    )}</a>`,
    link(scope, el, { value = 1 }) {
        const onClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            $rootScope.$emit('signup', {
                type: 'goto.step',
                data: { value: +value }
            });
        };

        el.on('click', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
        });
    }
});
export default signupStepLink;
