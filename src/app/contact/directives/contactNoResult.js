angular.module('proton.contact')
    .directive('contactNoResult', ($rootScope) => {
        function onClick(event) {
            const action = event.target.getAttribute('data-action');

            switch (action) {
                case 'add':
                    $rootScope.$emit('contacts', { type: 'addContact' });
                    break;
                case 'import':
                    $rootScope.$emit('contacts', { type: 'importContacts' });
                    break;
                default:
                    break;
            }
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
    });
