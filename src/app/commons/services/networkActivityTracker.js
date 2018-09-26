import _ from 'lodash';

/* @ngInject */
function networkActivityTracker($filter, AppModel, errorReporter, notification) {
    let promises = [];
    const unicodeTagView = $filter('unicodeTagView');

    /**
     * Check if we have some promises currently running
     * User to display the loading state
     */
    const loading = () => !_.isEmpty(promises);

    /**
     * Track promise to catch event around
     * @param {object} promise - Promise tracker
     * @return {object} promise - Return the orginal promise to stay in the same context
     */
    const track = (promise) => {
        errorReporter.clear();

        // Display the loader
        if (!promises.length) {
            AppModel.set('networkActivity', true);
        }

        promises = _.union(promises, [promise]);

        promise.catch((error) => {
            console.error(error);

            if (angular.isString(error)) {
                notification.error(error);
            }

            if (angular.isObject(error)) {
                const { data = {} } = error;
                let message;

                if (error.message) {
                    message = !error.raw ? unicodeTagView(error.message) : error.message;
                } else if (error.Error) {
                    message = error.Error;
                } else if (error.error_description) {
                    message = error.error_description;
                } else if (data.Error) {
                    message = data.Error;
                } else {
                    message = 'An error has occurred. <br> Please try again or refresh the page.';
                }

                if (!error.noNotify) {
                    notification.error(message);
                }

                return Promise.reject(error);
            }
        });

        function cleanup() {
            promises = _.without(promises, promise);

            // Nothing in the queue hide the loader
            if (!promises.length) {
                AppModel.set('networkActivity', false);
            }
        }

        // Do not use finally, not part of ES6
        promise.then(cleanup, cleanup);

        return promise;
    };

    const clear = () => {
        errorReporter.clear();
        promises.length = 0;
        return promises;
    };

    return { loading, clear, track };
}
export default networkActivityTracker;
