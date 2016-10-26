angular.module('proton.bugReport')
    .factory('bugReportModel', ($rootScope, bugReportApi, bugModal) => {

        $rootScope.$on('bugReport', (e, { type }) => {
            (type === 'new') && open();
        });

        /**
         * Generate the configuration for the modal
         * @param  {String} screenshot screenshot of the page
         * @return {Object}
         */
        const getModalParam = (screenshot) => ({
            params: {
                form: bugReportApi.getForm(),
                submit(form) {
                    bugReportApi.report(form, screenshot)
                        .then(bugModal.deactivate);
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
            bugReportApi.takeScreenshot()
                .then((screenshot) => {
                    bugModal.activate(getModalParam(screenshot));
                });
        }

        return { init: angular.noop };
    });
