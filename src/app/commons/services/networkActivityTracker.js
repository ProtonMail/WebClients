import _ from 'lodash';

import { unicodeTag } from '../../../helpers/string';

/* @ngInject */
function networkActivityTracker(AppModel, errorReporter, notification) {
    let promises = [];

    /**
     * Check if we have some promises currently running
     * User to display the loading state
     */
    const loading = () => !_.isEmpty(promises);

    /**
     * Track promise to catch event around
     * @param {object} promise - Promise tracker
     * @param {boolean} silent - Whether to notify errors
     * @return {object} promise - Return the orginal promise to stay in the same context
     */
    const track = (promise, silent = false) => {
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
                    message = !error.raw ? unicodeTag(error.message) : error.message;
                } else if (error.Error) {
                    message = error.Error;
                } else if (data.Error) {
                    message = data.Error;
                } else {
                    message = 'An error has occurred. <br> Please try again or refresh the page.';
                }

                if (!error.noNotify && !silent) {
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
