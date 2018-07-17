/* @ngInject */
function bugReportModel(bugReportApi, bugModal, dispatchers, gettextCatalog, networkActivityTracker, notification) {
    const { on } = dispatchers();
    const I18N = {
        phishingReported: gettextCatalog.getString('Phishing reported', null, 'Success notification')
    };

    on('bugReport', (e, { type, data = {} }) => {
        type === 'new' && open(data);
    });

    /**
     * Generate the configuration for the modal
     * @param  {String} screenshot screenshot of the page
     * @return {Object}
     */
    const getModalParam = (content) => ({
        params: {
            form: bugReportApi.getForm(),
            content,
            submit: async function(data) {
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
    function open({ content = '' }) {
        bugModal.activate(getModalParam(content));
    }

    const reportPhishing = async (message) => {
        const promise = bugReportApi.phishing(message);

        networkActivityTracker.track(promise);
        await promise;
        notification.success(I18N.phishingReported);
    };

    return { init: angular.noop, reportPhishing };
}
export default bugReportModel;
