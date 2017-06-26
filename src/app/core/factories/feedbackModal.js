angular.module('proton.core')
.factory('feedbackModal', (pmModal, Bug, notify, networkActivityTracker, gettextCatalog) => {
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
                    .then(() => {
                        notify({ message: gettextCatalog.getString('Thanks for your feedback!', null, 'Success message when sending feedback'), classes: 'notification-success' });
                        params.close();
                    });

                networkActivityTracker.track(feedbackPromise);
            };

            this.close = () => {
                params.close();
            };
        }
    });
});
