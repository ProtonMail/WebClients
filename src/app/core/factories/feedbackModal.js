angular.module('proton.core')
    .factory('feedbackModal', (pmModal, Bug, notification, networkActivityTracker, gettextCatalog) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/feedback.tpl.html',
            /* @ngInject */
            controller: function (params) {
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
                            notification.success(gettextCatalog.getString('Thanks for your feedback!', null, 'Success message when sending feedback'));
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
