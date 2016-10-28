angular.module('proton.core')
.factory('feedbackModal', (pmModal, $cookies, Bug, notify) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/feedback.tpl.html',
        controller(params) {
            this.fdbckTxt = '';

            this.submit = () => {
                const description = this.fdbckTxt;
                const data = {
                    OS: '--',
                    OSVersion: '--',
                    Browser: '--',
                    BrowserVersion: '--',
                    BrowserExtensions: '--',
                    Client: '--',
                    ClientVersion: '--',
                    Title: '[FEEDBACK v3]',
                    Username: '--',
                    Email: '--',
                    Description: description
                };

                const feedbackPromise = Bug.report(data);

                feedbackPromise
                .then((data) => {
                    if (data.Code === 1000) {
                        notify({ message: 'Thanks for your feedback!', classes: 'notification-success' });
                        params.close();
                    }
                })
                .catch((error) => {
                    notify({ message: error, classes: 'notification-danger' });
                });
            };

            this.close = () => {
                params.close();
            };
        }
    });
});
