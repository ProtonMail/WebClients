import _ from 'lodash';

import { openWindow, parseURL } from '../../../helpers/browser';

/* @ngInject */
function unsubscribeModel(
    dispatchers,
    composerFromModel,
    gettextCatalog,
    messageModel,
    notification,
    requestFormData,
    simpleSend,
    translator
) {
    const LIST = [];
    const UNSUBSCRIBE_REGEX = /<(.*?)>/g;
    const UNSUBSCRIBE_ONE_CLICK = 'List-Unsubscribe=One-Click';

    const { dispatcher, on } = dispatchers(['message']);

    const I18N = translator(() => ({
        SUCCESS: gettextCatalog.getString('Unsubscribed', null, 'Success notification')
    }));

    function already(list = '') {
        if (list.length) {
            return _.includes(LIST, list);
        }
        return false;
    }

    /**
     * Configure and send unsubscribe message
     * @param {String} value
     * @param {Object} address
     */
    function sendMessage(value = '', address) {
        const message = messageModel();
        const mailto = value.replace('mailto:', '');
        let j = mailto.indexOf('?');

        if (j < 0) {
            j = mailto.length;
        }

        const to = mailto.substring(0, j);
        const { searchObject = {} } = parseURL(mailto.substring(j + 1));

        message.AddressID = address.ID;
        message.From = address;
        message.Password = '';
        message.AutoSaveContacts = 0; // Override the global settings value to prevent auto adding recipients to contacts

        if (to) {
            message.ToList = to.split(',').map((email) => ({ Address: email, Name: email }));
        }

        message.Subject = searchObject.subject || 'Unsubscribe me';
        message.setDecryptedBody(searchObject.body || 'Unsubscribe me please');

        return simpleSend(message).then(() => notification.success(I18N.SUCCESS));
    }

    /**
     * Perform an HTTPS POST request to send the key/value pair in the List-Unsubscribe-Post header as the request body.
     * https://tools.ietf.org/html/rfc8058
     * @param  {String} url endpoint
     * @return {Promise}
     */
    const postRequest = (url = '') => {
        const data = new FormData();
        data.append('List-Unsubscribe', 'One-Click');
        return requestFormData({ method: 'POST', url, data, noOfflineNotify: true });
    };

    function unsubscribe(message = {}) {
        const list = message.getListUnsubscribe();
        const oneClick = message.getListUnsubscribePost() === UNSUBSCRIBE_ONE_CLICK;
        const matches = (list.match(UNSUBSCRIBE_REGEX) || []).map((m) => m.replace('<', '').replace('>', ''));
        const { address } = composerFromModel.get(message);

        _.each(matches, (value = '') => {
            const startsWithHttp = value.startsWith('http');

            value.startsWith('mailto:') && sendMessage(value, address);
            startsWithHttp && !oneClick && openWindow(value);
            startsWithHttp && oneClick && postRequest(value); // NOTE Present with MailChimp message but has CORB issue
        });

        LIST.push(list);
        dispatcher.message('unsubscribed', { message });
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

    on('message', (event, { type, data = {} }) => {
        type === 'unsubscribe' && unsubscribe(data.message);
    });

    return { init: angular.noop, already, beginsWith };
}
export default unsubscribeModel;
