import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function bugReportModel(
    $injector,
    bugReportApi,
    bugModal,
    confirmModal,
    dispatchers,
    eventManager,
    gettextCatalog,
    networkActivityTracker,
    notification,
    translator
) {
    const { on } = dispatchers();
    const I18N = translator(() => ({
        phishingTitle: gettextCatalog.getString('Confirm phishing report', null, 'Title for report phishing modal'),
        phishingMessage: gettextCatalog.getString(
            'Reporting a message as a phishing attempt will send the message to us, so we can analyze it and improve our filters. This means that we will be able to see the contents of the message in full.',
            null,
            'Message for report phishing modal'
        ),
        phishingReported: gettextCatalog.getString('Phishing reported', null, 'Success notification')
    }));

    /**
     * Generate the configuration for the modal
     * @param  {String} screenshot screenshot of the page
     * @return {Object}
     */
    const getModalParam = (content) => ({
        params: {
            form: bugReportApi.getForm(),
            content,
            async submit(data) {
                bugModal.deactivate();
                const formData = await bugReportApi.toFormData(data);
                bugReportApi.report(formData);
            },
            cancel() {
                bugModal.deactivate();
            }
        }
    });

    /**
     * Take a screenshot of the page then open the modal
     * @return {void}
     */
    const open = ({ content = '' }) => bugModal.activate(getModalParam(content));

    on('bugReport', (e, { type, data = {} }) => {
        type === 'new' && open(data);
    });

    /**
     * Open a modal to confirm the report phishing action
     * @return {Promise}
     */
    const confirmPhishing = () => {
        return new Promise((resolve, reject) => {
            confirmModal.activate({
                params: {
                    title: I18N.phishingTitle,
                    message: I18N.phishingMessage,
                    isWarning: true,
                    confirm() {
                        resolve();
                        confirmModal.deactivate();
                    },
                    cancel() {
                        reject();
                        confirmModal.deactivate();
                    }
                }
            });
        });
    };

    /**
     * Report phishing and move the message to SPAM
     * @param  {messageModel}  message
     * @return {Promise}
     */
    const reportPhishing = async (message) => {
        await confirmPhishing();
        const messageApi = $injector.get('messageApi'); // Use injector to not add messageApi in app.js
        const promise = Promise.all([
            bugReportApi.phishing(message),
            messageApi.label({ LabelID: MAILBOX_IDENTIFIERS.spam, IDs: [message.ID] })
        ]).then(eventManager.call);
        networkActivityTracker.track(promise);
        await promise;
        notification.success(I18N.phishingReported);
    };

    return { init: angular.noop, reportPhishing };
}
export default bugReportModel;
