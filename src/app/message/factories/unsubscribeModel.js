angular.module('proton.message')
    .factory('unsubscribeModel', ($rootScope, authentication, gettextCatalog, messageModel, notification, parseUrl, simpleSend) => {
        const LIST = [];
        const UNSUBSCRIBE_REGEX = /<(.*?)>/g;
        const openTab = (url = '') => window.open(url, '_blank');
        const successMessage = gettextCatalog.getString('Unsubscribed', null, 'Success notification');

        function already(list = '') {
            if (list.length) {
                return _.contains(LIST, list);
            }
            return false;
        }

        function sendMessage(value = '', addressID) {
            const message = messageModel();
            const mailto = value.replace('mailto:', '');
            let j = mailto.indexOf('?');

            if (j < 0) {
                j = mailto.length;
            }

            const to = mailto.substring(0, j);
            const { searchObject = {} } = parseUrl(mailto.substring(j + 1));

            message.AddressID = addressID || authentication.user.Addresses[0].ID;
            message.From = _.findWhere(authentication.user.Addresses, { ID: message.AddressID });
            message.Password = '';

            if (to) {
                message.ToList = to.split(',').map((email) => ({ Address: email, Name: email }));
            }

            if (searchObject.subject) {
                message.Subject = searchObject.subject;
            }

            if (searchObject.body) {
                message.setDecryptedBody(searchObject.body);
            }

            return simpleSend(message)
                .then(() => notification.success(successMessage));
        }


        function unsubscribe(message = {}) {
            const list = message.getListUnsubscribe();
            const matches = (list.match(UNSUBSCRIBE_REGEX) || []).map((m) => m.replace('<', '').replace('>', ''));
            const addressID = message.AddressID;

            _.each(matches, (value = '') => {
                value.startsWith('mailto:') && sendMessage(value, addressID);
                value.startsWith('http') && openTab(value);
            });

            LIST.push(list);
            $rootScope.$emit('message', { type: 'unsubscribed', data: { message } });
        }

        $rootScope.$on('message', (event, { type, data = {} }) => {
            (type === 'unsubscribe') && unsubscribe(data.message);
        });

        return { init: angular.noop, already };
    });
