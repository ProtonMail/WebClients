angular.module('proton.core')
.factory('feedbackModal', (pmModal, $cookies, Bug, notify) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/feedback.tpl.html',
        controller(params) {
            this.fdbckTxt = '';

            this.submit = function () {
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

                feedbackPromise.then(
                    (response) => {
                        if (response.data.Code === 1000) {
                            notify({ message: 'Thanks for your feedback!', classes: 'notification-success' });
                        } else if (angular.isDefined(response.data.Error)) {
                            notify({ message: response.data.Error, classes: 'notification-danger' });
                        }
                        params.close();
                    },
                    (error) => {
                        error.message = 'Error during the sending feedback';
                        params.close();
                    }
                );
            };

            this.close = function () {
                params.close();
            };
        }
    });
});
