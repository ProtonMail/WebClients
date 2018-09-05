/* @ngInject */
function contactError(dispatchers) {
    return {
        replace: true,
        templateUrl: require('../../../templates/contact/contactError.tpl.html'),
        link(scope, el) {
            const { dispatcher } = dispatchers(['contacts']);

            const onClick = (e) => {
                if (e.target.nodeName === 'BUTTON' && e.target.dataset.action === 'resign') {
                    dispatcher.contacts('updateContact', { contact: scope.contact });
                }
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default contactError;
