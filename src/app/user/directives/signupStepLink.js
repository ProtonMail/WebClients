/* @ngInject */
const signupStepLink = (dispatchers) => ({
    replace: true,
    restrict: 'A',
    link(scope, el, { signupStepLink = 1 }) {
        const { dispatcher } = dispatchers(['signup']);

        const onClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatcher.signup('goto.step', { value: +signupStepLink });
        };

        el.on('click', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
        });
    }
});
export default signupStepLink;
