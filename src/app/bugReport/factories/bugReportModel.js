angular.module('proton.bugReport')
    .factory('bugReportModel', ($rootScope, bugReportApi, bugModal) => {

        $rootScope.$on('bugReport', (e, { type }) => {
            (type === 'new') && open();
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
        const getModalParam = () => ({
            params: {
                form: bugReportApi.getForm(),
                submit(data) {
                    const form = angular.copy(data);

                    bugModal.deactivate();
                    takeScreenshot(form)
                        .then((screenshot) => bugReportApi.report(form, screenshot));
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
        function open() {
            bugModal.activate(getModalParam());
        }

        return { init: angular.noop };
    });
