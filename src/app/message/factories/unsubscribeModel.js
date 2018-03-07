import _ from 'lodash';
import { openWindow, parseURL } from '../../../helpers/browser';

/* @ngInject */
function unsubscribeModel($rootScope, authentication, gettextCatalog, messageModel, notification, simpleSend) {

    const LIST = [];
    const UNSUBSCRIBE_REGEX = /<(.*?)>/g;

    const successMessage = gettextCatalog.getString('Unsubscribed', null, 'Success notification');

    function already(list = '') {
        if (list.length) {
            return _.includes(LIST, list);
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
        const { searchObject = {} } = parseURL(mailto.substring(j + 1));

        message.AddressID = addressID || authentication.user.Addresses[0].ID;
        message.From = _.find(authentication.user.Addresses, { ID: message.AddressID });
        message.Password = '';
        message.AutoSaveContacts = 0; // Override the global settings value to prevent auto adding recipients to contacts

        if (to) {
            message.ToList = to.split(',').map((email) => ({ Address: email, Name: email }));
        }

        if (searchObject.subject) {
            message.Subject = searchObject.subject;
        }

        if (searchObject.body) {
            message.setDecryptedBody(searchObject.body);
        }

        return simpleSend(message).then(() => notification.success(successMessage));
    }

    function unsubscribe(message = {}) {
        const list = message.getListUnsubscribe();
        const matches = (list.match(UNSUBSCRIBE_REGEX) || []).map((m) => m.replace('<', '').replace('>', ''));
        const addressID = message.AddressID;

        _.each(matches, (value = '') => {
            value.startsWith('mailto:') && sendMessage(value, addressID);
            value.startsWith('http') && openWindow(value);
        });

        LIST.push(list);
        $rootScope.$emit('message', { type: 'unsubscribed', data: { message } });
    }

    /**
     * Know if we unsubscribe with link or message method
     * @param  {Object}  message
     * @param  {String}  type: 'http' or 'mailto:'
     * @return {Boolean}
     */
    function beginsWith(message, type) {
        const list = message.getListUnsubscribe();
        const matches = (list.match(UNSUBSCRIBE_REGEX) || []).map((m) => m.replace('<', '').replace('>', ''));

        return _.find(matches, (value = '') => value.startsWith(type));
    }

    $rootScope.$on('message', (event, { type, data = {} }) => {
        type === 'unsubscribe' && unsubscribe(data.message);
    });

    return { init: angular.noop, already, beginsWith };
}
export default unsubscribeModel;
