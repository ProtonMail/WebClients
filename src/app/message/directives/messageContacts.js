/* @ngInject */
function messageContacts(gettextCatalog) {
    const MAP = {
        BCC: gettextCatalog.getString('BCC', null, 'Title'),
        CC: gettextCatalog.getString('CC', null, 'Title'),
        To: gettextCatalog.getString('To', null, 'Title')
    };

    return {
        templateUrl: require('../../../templates/message/messageContacts.tpl.html'),
        replace: true,
        scope: {
            model: '=',
            messageId: '='
        },
        link(scope, el, { list = 'To' }) {
            const $label = el[0].querySelector('.messageContacts-where');
            $label.textContent = MAP[list];
        }
    };
}
export default messageContacts;
