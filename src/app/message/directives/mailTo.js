angular.module('proton.message')
.directive('mailTo', ($rootScope, $location, regexEmail, Message, authentication) => ({
    restrict: 'A',
    link(scope, element) {
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
            const params = $location.search(mailto.substring(j + 1)).search();
            const message = new Message();

            message.From = _.findWhere(authentication.user.Addresses, {ID: scope.message.AddressID});

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

            $rootScope.$emit('composer.new', {message, type: 'new'});
        }

        element.on('click', click);
        scope.$on('$destroy', () => { element.off('click', click); });
    }
}));
