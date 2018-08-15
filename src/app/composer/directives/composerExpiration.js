import _ from 'lodash';

import { MAX_EXPIRATION_TIME } from '../../constants';

/* @ngInject */
function composerExpiration(dispatchers, notification, gettextCatalog) {
    const { dispatcher } = dispatchers(['composer.update']);
    const MESSAGES = {
        maxEpiration: gettextCatalog.getString('The maximum expiration is 4 weeks.', null, 'Error'),
        invalid: gettextCatalog.getString('Invalid expiration time.', null, 'Error')
    };

    const dispatch = (type, message) => dispatcher['composer.update'](type, { message, type: 'expiration' });

    const formatOption = (size) => _.range(size).map((value) => ({ label: `${value}`, value }));

    const OPTIONS = {
        week: formatOption(5),
        day: formatOption(7),
        hour: formatOption(24)
    };

    /**
     * Intialize the expiration panel
     * @param {Object} message
     */
    const initModel = (message) => {
        if (angular.isDefined(message.ExpirationTime)) {
            const deltaHours = message.ExpirationTime / 3600;
            const deltaDays = Math.floor(deltaHours / 24);

            return {
                weeks: angular.copy(_.find(OPTIONS.week, { value: Math.floor(deltaDays / 7) })),
                days: angular.copy(_.find(OPTIONS.day, { value: deltaDays % 7 })),
                hours: angular.copy(_.find(OPTIONS.hour, { value: deltaHours % 24 }))
            };
        }

        return { days: 0, hours: 0, weeks: 0 };
    };

    const computeHours = ({ days, hours, weeks }) => hours.value + (days.value + weeks.value * 7) * 24;

    return {
        replace: true,
        scope: {
            message: '='
        },
        templateUrl: require('../../../templates/composer/composerExpiration.tpl.html'),
        link(scope, el) {
            const $cancel = el.find('.composerExpiration-btn-cancel');
            scope.model = initModel(scope.message);
            scope.options = OPTIONS;

            const onSubmit = (e) => {
                // We don't want to submit the whole composer
                e.stopPropagation();

                const hours = computeHours(scope.model);

                // How can we enter in this situation?
                if (parseInt(hours, 10) > MAX_EXPIRATION_TIME) {
                    return notification.error(MESSAGES.maxEpiration);
                }

                if (isNaN(hours)) {
                    return notification.error(MESSAGES.invalid);
                }

                scope.$applyAsync(() => {
                    scope.message.ExpirationTime = hours * 3600; // seconds
                    dispatch('close.panel', scope.message);
                });
            };

            const onCancel = () => {
                scope.$applyAsync(() => {
                    delete scope.message.ExpirationTime;
                    scope.expirationForm.$setUntouched();
                    dispatch('close.panel', scope.message);
                });
            };

            el.on('submit', onSubmit);
            $cancel.on('click', onCancel);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
                $cancel.off('click', onCancel);
            });
        }
    };
}
export default composerExpiration;
