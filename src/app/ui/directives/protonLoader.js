/* @ngInject */
const protonLoader = (dispatchers) => ({
    replace: true,
    scope: {},
    templateUrl: require('../../../templates/directives/ui/protonLoader.tpl.html'),
    link(scope, el) {
        const { on, unsubscribe } = dispatchers();

        on('networkActivity', (e, type) => {
            type === 'load' && _rAF(() => el[0].classList.add('show'));
            type === 'close' && _rAF(() => el[0].classList.remove('show'));
        });

        scope.$on('$destroy', unsubscribe);
    }
});
export default protonLoader;
