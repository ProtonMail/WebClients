import { wait } from '../../../helpers/promiseHelper';
import { MAX_RETRY_AFTER_TIMEOUT, MAX_RETRY_AFTER_ATTEMPT } from '../../constants';

/* @ngInject */
function handle429($http) {
    const recall = (config) => $http(config);

    return (rejection) => {
        const retryAttempt = rejection.config.retryAttempt || 0;
        const retryAfterSeconds = parseInt(rejection.headers('retry-after'), 10);

        if (
            !retryAfterSeconds ||
            retryAfterSeconds <= 0 ||
            retryAfterSeconds >= MAX_RETRY_AFTER_TIMEOUT ||
            retryAttempt >= MAX_RETRY_AFTER_ATTEMPT
        ) {
            return Promise.reject(rejection);
        }

        const retryAfterMilliseconds = retryAfterSeconds * 1000;
        const recallConfig = {
            ...rejection.config,
            retryAttempt: retryAttempt + 1
        };

        return wait(retryAfterMilliseconds).then(() => recall(recallConfig));
    };
}

export default handle429;
