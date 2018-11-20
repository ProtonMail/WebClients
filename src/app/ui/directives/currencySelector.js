/* @ngInject */
function currencySelector(dispatchers) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/ui/currencySelector.tpl.html'),
        scope: {},
        link(scope, el, { name = '', currency = '' }) {
            const { dispatcher, on, unsubscribe } = dispatchers([name]);

            const activate = (currency) => {
                el[0].dataset.currency = currency;
            };

            const onClick = ({ target }) => {
                const currency = target.getAttribute('value');
                if (!currency) {
                    return;
                }

                dispatcher[name]('change', currency);
                activate(currency);
            };

            el.on('click', onClick);

            on(name, (event, { type, data }) => type === 'set' && activate(data));

            activate(currency);

            scope.$on('$destroy', () => {
                unsubscribe();
                el.off('click', onClick);
            });
        }
    };
}

export default currencySelector;
