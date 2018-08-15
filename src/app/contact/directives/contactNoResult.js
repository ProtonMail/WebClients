/* @ngInject */
function contactNoResult(dispatchers) {
    const { dispatcher } = dispatchers(['contacts']);
    const MAP = {
        add: 'addContact',
        import: 'importContacts'
    };
    function onClick(event) {
        const action = event.target.getAttribute('data-action');
        MAP[action] && dispatcher.contacts(MAP[action]);
    }

    return {
        replace: true,
        templateUrl: require('../../../templates/contact/contactNoResult.tpl.html'),
        link(scope, element) {
            element.on('click', onClick);
            scope.$on('$destroy', () => {
                element.off('click', onClick);
            });
        }
    };
}
export default contactNoResult;
