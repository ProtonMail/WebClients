angular.module('proton.message')
.directive('mailTo', ($rootScope, regexEmail, Message, authentication) => ({
    restrict: 'A',
    link(scope, element) {
        function parseQuery(str) {
            return str.split('&').reduce((query, pairStr) => {
                const pair = pairStr.split('=');
                query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
                return query;
            }, {});
        }

        function toAddresses(emails) {
            return emails.map((email) => {
                return {
                    Address: email,
                    Name: email
                };
            });
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
            const params = parseQuery(mailto.substring(j + 1));

            const message = new Message();
            _.defaults(message, {
                From: _.findWhere(authentication.user.Addresses, {ID: scope.message.AddressID}) || {},
                PasswordHint: '',
                Attachments: [],
                ToList: [],
                Subject: '',
                CCList: [],
                BCCList: []
            });

            if (to) {
                message.ToList = toAddresses(to.split(','));
            }
            if (params.subject) {
                message.Subject = params.subject;
            }
            if (params.cc) {
                message.CCList = toAddresses(params.cc.split(','));
            }
            if (params.bcc) {
                message.BCCList = toAddresses(params.bcc.split(','));
            }
            if (params.body) {
                message.DecryptedBody = params.body;
            }

            $rootScope.$broadcast('loadMessage', message);
        }

        element.on('click', click);
        scope.$on('$destroy', () => { element.off('click', click); });
    }
}));
