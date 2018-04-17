/* @ngInject */
function bugReportModel(bugReportApi, bugModal, dispatchers) {
    const { on } = dispatchers();

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

    return { init: angular.noop };
}
export default bugReportModel;
