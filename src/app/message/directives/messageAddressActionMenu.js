import _ from 'lodash';

/* @ngInject */
function messageAddressActionMenu(
    dispatchers,
    messageModel,
    $state,
    contactEmails,
    messageSenderSettings,
    ptClipboard
) {
    const getContact = (Email) => _.find(contactEmails.get(), { Email });

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageAddressActionMenu.tpl.html'),
        replace: true,
        scope: {
            message: '=',
            email: '='
        },
        link(scope, el) {
            const { dispatcher } = dispatchers(['composer.new']);

            const toggle = (node, className, value) => {
                return elem[0].classList.contains(className) === value || node.classList.toggle(className);
            };

            const advancedSettings = () => messageSenderSettings.showSettings(scope);
            const composeTo = () => {
                const { address: Address, name: Name, isContactGroup } = STATE.address;

                const message = messageModel({
                    ToList: [{ Address, Name, Group: isContactGroup ? Name : '' }]
                });
                dispatcher['composer.new']('new', { message });
            };

            const advancedSettings = () => messageSenderSettings.showSettings(scope);
            const showContact = () => {
                const { ContactID: id } = getContact(STATE.address.address) || {};
                id && $state.go('secured.contacts.details', { id });
            };

            const openDropdown = (element) => {
                dispatcher.dropdown('close');
                trigger.click();
                const { top: buttonTop, left: buttonLeft } = element.offset();
                menu.offset({ top: buttonTop + 5, left: buttonLeft + 15 });
            };

            const ACTIONS = {
                'compose-to': composeTo,
                'contact-details': showContact,
                'advanced-settings': advancedSettings
            };

            menu.on('click', ({ target }) => {
                if (target.nodeName !== 'BUTTON') {
                    return;
                }
                (ACTIONS[target.dataset.action] || _.noop)();
                dispatcher.dropdown('close');
            });

            on('messageAddressActions', (e, { type, data: { messageID, address, element } }) => {
                if (type === 'show' && scope.message.ID === messageID) {
                    STATE.address = address;

                    const isContact = !!getContact(address.address);
                    toggle(elem[0], 'address-is-contact', isContact);
                    toggle(elem[0], 'show-advanced-settings', scope.message.Sender.Address === address.address);
                    toggle(elem[0], 'messageAddressActionMenu-isGroup', address.isContactGroup);

                    openDropdown(element);
                }

                if (type === 'hide' && scope.message.ID === messageID) {
                    dispatcher.dropdown('close');
                }
            });

            scope.$on('$destroy', () => {
                destroy();
                unsubscribe();
            });
        }
    };
}
export default messageAddressActionMenu;
