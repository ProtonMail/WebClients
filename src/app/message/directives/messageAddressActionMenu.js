import _ from 'lodash';

/* @ngInject */
function messageAddressActionMenu(
    dispatchers,
    messageModel,
    $state,
    contactEmails,
    messageSenderSettings,
    contactFilter,
    ptClipboard
) {
    const getContact = (Email) => _.find(contactEmails.get(), { Email }) || {};

    function link(scope, el) {
        const unsubscribe = [];
        const { dispatcher } = dispatchers(['composer.new']);

        const toggle = (node, className, value) => {
            return el[0].classList.contains(className) === value || node.classList.toggle(className);
        };

        const contact = getContact(scope.email.Address);
        const contactInfo = {
            Address: scope.email.Address,
            Name: contactFilter(scope.email, 'Name'),
            isContactGroup: !!scope.email.isContactGroup
        };

        toggle(el[0], 'messageAddressActionMenu-isContact', !!contact.ContactID);
        toggle(el[0], 'messageAddressActionMenu-isSender', scope.message.Sender.Address === scope.email.Address);
        toggle(el[0], 'messageAddressActionMenu-isGroup', !!scope.email.isContactGroup);

        const advancedSettings = () => messageSenderSettings.showSettings(scope);
        const showContact = () => {
            const { ContactID: id } = getContact(contactInfo.Address);
            if (id) {
                // force reload url as we will load another app
                window.location.href = `/contacts/${id}`;
            }
        };

        const composeTo = () => {
            const { Address, Name, isContactGroup } = contactInfo;
            const message = messageModel({
                ToList: [{ Address, Name, Group: isContactGroup ? Name : '' }]
            });
            dispatcher['composer.new']('new', { message });
        };

        const ACTIONS = {
            'compose-to': composeTo,
            'contact-details': showContact,
            'advanced-settings': advancedSettings
        };

        const onClick = (e) => {
            e.stopPropagation();
            const { target } = e;
            if (target.nodeName !== 'BUTTON') {
                return;
            }
            const action = target.dataset.action;
            ACTIONS[action] && ACTIONS[action]();
        };

        scope.$applyAsync(() => {
            const copyButton = el[0].querySelector('.messageAddressActionMenu-btn-copy-address');
            const { destroy } = ptClipboard(copyButton, () => scope.email.Address);
            unsubscribe.push(destroy);
        });

        el.on('click', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
            unsubscribe.forEach((cb) => cb());
            unsubscribe.length = 0;
        });
    }

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageAddressActionMenu.tpl.html'),
        replace: true,
        scope: {
            message: '=',
            email: '='
        },
        compile(el, { position }) {
            if (position) {
                const node = el[0].querySelector('.messageAddressActionMenu-drop');
                node.setAttribute('data-position', position);
            }
            return link;
        }
    };
}
export default messageAddressActionMenu;
