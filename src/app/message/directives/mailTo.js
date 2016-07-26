angular.module('proton.message')
.directive('mailTo', ($rootScope, regexEmail, Message) => ({
    restrict: 'A',
    link(scope, element) {
        var click = function(event) {
            if (event.target.tagName === 'A') {
                var href = event.target.getAttribute('href');

                if (href) {

                    var mailTo = href.indexOf('mailto') === 0;
                    var emails = event.target.getAttribute('href').match(regexEmail);

                    if (mailTo && emails) {
                        
                        event.preventDefault();
                        
                        var message = new Message();
                        var ToList = [];

                        ToList.push({
                            Address: emails[0],
                            Name: emails[0]
                        });

                        _.defaults(message, {
                            ToList: ToList,
                            CCList: [],
                            BCCList: [],
                            Subject: '',
                            PasswordHint: '',
                            Attachments: []
                        });

                        $rootScope.$broadcast('loadMessage', message);
                    }
                }
            }
        };

        element.on('click', click);
        scope.$on('$destroy', () => { element.off('click', click); });
    }
}));
