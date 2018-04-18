import { CLIENT_TYPE } from '../../constants';

/* @ngInject */
function feedbackModal(pmModal, Report, notification, networkActivityTracker, gettextCatalog) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/feedback.tpl.html'),
        /* @ngInject */
        controller: function(params) {
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
                    ClientType: CLIENT_TYPE,
                    Title: '[FEEDBACK v3]',
                    Username: '--',
                    Email: '--',
                    Description: description
                };

                const feedbackPromise = Report.bug(data);

                feedbackPromise.then(() => {
                    notification.success(
                        gettextCatalog.getString(
                            'Thanks for your feedback!',
                            null,
                            'Success message when sending feedback'
                        )
                    );
                    params.close();
                });

                networkActivityTracker.track(feedbackPromise);
            };

            this.close = () => {
                params.close();
            };
        }
    });
}
export default feedbackModal;
