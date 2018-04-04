/* @ngInject */
function messageAddressActions(dispatchers) {
    const BUTTON_DROPDOWN_COLLAPSED = 'fa-caret-down';
    const BUTTON_DROPDOWN_OPENED = 'fa-caret-right';
    const addListener = (element, names, listener, unsubscribe) => {
        names.forEach((name) => {
            element.addEventListener(name, listener);
            unsubscribe.push(() => element.removeEventListener(name, listener));
        });
    };

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageAddressActions.tpl.html'),
        replace: true,
        scope: {
            messageId: '='
        },
        link(scope, el, { address, name }) {
            const unsubscribeList = [];
            const { on, unsubscribe, dispatcher } = dispatchers(['messageAddressActions']);
            unsubscribeList.push(unsubscribe);
            const button = el[0].querySelector('.message-address-action-button');
            const icon = button.querySelector('i');

            const openDropdown = () => {
                dispatcher.messageAddressActions('show', {
                    messageID: scope.messageId,
                    address: { address: address.replace(/[<>]/g, ''), name },
                    element: el
                });
            };

            const hideDropdown = () => {
                icon.classList.remove(BUTTON_DROPDOWN_OPENED);
                icon.classList.add(BUTTON_DROPDOWN_COLLAPSED);
            };

            const onClick = (e) => {
                openDropdown();
                icon.classList.remove(BUTTON_DROPDOWN_COLLAPSED);
                icon.classList.add(BUTTON_DROPDOWN_OPENED);
                e.stopPropagation();
            };

            const stopPropagation = (e) => e.stopPropagation();

            addListener(button, ['click'], onClick, unsubscribeList);
            addListener(button, ['click', 'mouseup', 'touchend'], stopPropagation, unsubscribeList);

            on('closeDropdown', hideDropdown);

            scope.$on('$destroy', () => {
                unsubscribeList.forEach((unsubscribe) => unsubscribe());
            });
        }
    };
}
export default messageAddressActions;
