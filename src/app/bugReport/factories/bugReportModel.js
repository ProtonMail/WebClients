/* @ngInject */
function bugReportModel($rootScope, bugReportApi, bugModal) {

    $rootScope.$on('bugReport', (e, { type, data = {} }) => {
        type === 'new' && open(data);
    });

    const takeScreenshot = ({ attachScreenshot }) => {
        if (attachScreenshot) {
            return bugReportApi.takeScreenshot();
        }
        return Promise.resolve();
    };

    /**
     * Generate the configuration for the modal
     * @param  {String} screenshot screenshot of the page
     * @return {Object}
     */
    const getModalParam = (content) => ({
        params: {
            form: bugReportApi.getForm(),
            content,
            submit(data) {
                const form = angular.copy(data);
                bugModal.deactivate();
                takeScreenshot(form).then((screenshot) => bugReportApi.report(form, screenshot));
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

    return { init: angular.noop };
}
export default bugReportModel;
