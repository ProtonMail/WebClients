import _ from 'lodash';
import { parseURL } from '../../../helpers/browser';

/* @ngInject */
const mailTo = ($rootScope, messageModel, authentication) => ({
    restrict: 'A',
    link(scope, element) {
        function toAddresses(emails) {
            return emails.map((Address) => ({ Address, Name: Address }));
        }

        function click(event) {
            const link = event.target;
            if (link.tagName.toUpperCase() !== 'A') {
                return;
            }

            let mailto = link.href;
            if (mailto.indexOf('mailto:') !== 0) {
                return;
            }
            mailto = mailto.replace('mailto:', '');

            event.preventDefault();

            let j = mailto.indexOf('?');

            if (j < 0) {
                j = mailto.length;
            }

            const to = mailto.substring(0, j);
            const { searchObject = {} } = parseURL(mailto.substring(j + 1));
            const message = messageModel();

            message.From = _.find(authentication.user.Addresses, { ID: scope.message.AddressID });

            if (to) {
                message.ToList = toAddresses(to.split(','));
            }

            if (searchObject.subject) {
                message.Subject = searchObject.subject;
            }

            if (searchObject.cc) {
                message.CCList = toAddresses(searchObject.cc.split(','));
            }

            if (searchObject.bcc) {
                message.BCCList = toAddresses(searchObject.bcc.split(','));
            }

            if (searchObject.body) {
                message.DecryptedBody = searchObject.body;
            }

            $rootScope.$emit('composer.new', { type: 'new', data: { message } });
        }

        element.on('click', click);
        scope.$on('$destroy', () => {
            element.off('click', click);
        });
    }
});
export default mailTo;
