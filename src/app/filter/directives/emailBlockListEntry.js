angular.module('proton.filter')
    .directive('emailBlockListEntry', () => {

        /* const onEvent = (element, type, callback) => {
            element.addEventListener(type, callback);
            return () => element.removeEventListener(type, callback);
        }; */

        return {
            replace: true,
            restrict: 'A', // This an attribute directive: otherwise DOM will move the directive out of the table.
            templateUrl: 'templates/filter/emailBlockListEntry.tpl.html',
            scope: {},
            link(scope, elem, { emailValue }) {

                const emailElement = elem[0].querySelector('.blocklist-email-value');
                emailElement.textContent = emailValue;

                // const switchlist = spamListModel.getList(switchTo);

                // const unsubscribe = [];

                // const switchElement = elem[0].querySelector('.blocklist-email-switch');
                // unsubscribe.push(onEvent(switchElement, 'click', () => switchlist.adopt(entryId)));

                // const deleteElement = elem[0].querySelector('.blocklist-email-delete');
                // unsubscribe.push(onEvent(deleteElement, 'click', () => spamListModel.deleteEntry(entryId)));

                /* scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                }); */
            }
        };
    });
