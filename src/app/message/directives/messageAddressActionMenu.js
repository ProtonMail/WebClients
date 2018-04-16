import _ from 'lodash';

/* @ngInject */
function messageAddressActionMenu(
    dispatchers,
    messageModel,
    $state,
    contactEmails,
    notification,
    gettextCatalog,
    messageSenderSettings
) {
    const I18N = {
        copied: gettextCatalog.getString('Copied to clipboard', null),
        errorCopied: gettextCatalog.getString('Error while copying', null)
    };

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageAddressActionMenu.tpl.html'),
        replace: true,
        link(scope, elem) {
            const { dispatcher, unsubscribe, on } = dispatchers(['contacts', 'composer.new', 'closeDropdown']);
            const STATE = {};

            const toggle = (node, className, value) => {
                return elem[0].classList.contains(className) === value || node.classList.toggle(className);
            };
            const trigger = elem.find('.message-address-trigger');
            const menu = elem.find('.pm_dropdown');
            const copyButton = elem.find('.message-action-copy-address');

            const composeTo = () => {
                const message = messageModel();
                message.ToList = [{ Address: STATE.address.address, Name: STATE.address.name }];
                dispatcher['composer.new']('new', { message });
            };

            const addContact = () => {
                dispatcher.contacts('addContact', { email: STATE.address.address, name: STATE.address.name });
            };

            const clipboard = new Clipboard(copyButton[0], {
                text() {
                    return STATE.address.address;
                }
            });
            clipboard.on('success', () => notification.success(I18N.copied));
            clipboard.on('error', () => notification.error(I18N.errorCopied));

            const getContact = (email) => _.find(contactEmails.get(), { Email: email });
            const showContact = () => {
                const contact = _.find(contactEmails.get(), { Email: STATE.address.address });

                if (contact) {
                    $state.go('secured.contacts.details', { id: contact.ContactID });
                }
            };

            const advancedSettings = () => {
                messageSenderSettings.showSettings(scope);
            };

            menu.on('click', ({ target }) => {
                if (target.nodeName !== 'BUTTON') {
                    return;
                }
                switch (target.dataset.action) {
                    case 'compose-to':
                        composeTo();
                        break;
                    case 'add-contact':
                        addContact();
                        break;
                    case 'contact-details':
                        showContact();
                        break;
                    case 'advanced-settings':
                        advancedSettings();
                }

                dispatcher.closeDropdown('close');
            });

            const openDropdown = (element) => {
                trigger.click();
                const { top: buttonTop, left: buttonLeft } = element.offset();
                menu.offset({ top: buttonTop + 5, left: buttonLeft + 10 });
            };

            on('messageAddressActions', (e, { type, data: { messageID, address, element } }) => {
                if (type === 'show' && scope.message.ID === messageID) {
                    STATE.address = address;

                    const isContact = !!getContact(address.address);
                    toggle(elem[0], 'address-is-contact', isContact);
                    toggle(elem[0], 'show-advanced-settings', scope.message.Sender.Address === address.address);

                    openDropdown(element);
                }
            });

            scope.$on('$destroy', () => {
                clipboard.destroy();
                unsubscribe();
            });
        }
    };
}
export default messageAddressActionMenu;
