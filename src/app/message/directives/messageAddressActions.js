/* @ngInject */
function messageAddressActions(dispatchers, $filter) {
    const DROPDOWN_OPENED = 'messageAddressActions-open';
    const contactFilter = $filter('contact');

    const addListener = (element, names, listener) => {
        const list = [];
        names.forEach((name) => {
            element.on(name, listener);
            list.push(() => element.off(name, listener));
        });
        return list;
    };

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageAddressActions.tpl.html'),
        replace: true,
        scope: {
            messageId: '=',
            email: '='
        },
        link(scope, el) {
            const { on, unsubscribe, dispatcher } = dispatchers(['messageAddressActions']);

            const openDropdown = () => {
                dispatcher.messageAddressActions('show', {
                    messageID: scope.messageId,
                    address: {
                        address: scope.email.Address,
                        name: contactFilter(scope.email, 'Name'),
                        isContactGroup: !!scope.email.isContactGroup
                    },
                    element: el
                });
            };

            const hideDropdown = () => el[0].classList.remove(DROPDOWN_OPENED);

            const onClick = () => {
                if (el[0].classList.contains(DROPDOWN_OPENED)) {
                    dispatcher.messageAddressActions('hide', { messageID: scope.messageId });
                    return hideDropdown();
                }
                openDropdown();
                el[0].classList.add(DROPDOWN_OPENED);
            };

            const stopPropagation = (e) => e.stopPropagation();

            on('dropdown', hideDropdown);

            const unsubscribeList = [
                unsubscribe,
                ...addListener(el, ['click', 'mouseup', 'touchend'], stopPropagation),
                ...addListener(el, ['click'], onClick)
            ];

            scope.$on('$destroy', () => {
                unsubscribeList.forEach((cb) => cb());
            });
        }
    };
}
export default messageAddressActions;
