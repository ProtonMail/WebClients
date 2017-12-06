/* @ngInject */
function contactNoResult($rootScope) {
    const MAP = {
        add: 'addContact',
        import: 'importContacts'
    };
    function onClick(event) {
        const action = event.target.getAttribute('data-action');
        MAP[action] && $rootScope.$emit('contacts', { type: MAP[action] });
    }

    return {
        replace: true,
        templateUrl: 'templates/contact/contactNoResult.tpl.html',
        link(scope, element) {
            element.on('click', onClick);
            scope.$on('$destroy', () => {
                element.off('click', onClick);
            });
        }
    };
}
export default contactNoResult;
