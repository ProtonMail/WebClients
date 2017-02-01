angular.module('proton.composer')
    .directive('composerExpiration', (notify, gettextCatalog, $rootScope, CONSTANTS) => {
        const MESSAGES = {
            maxEpiration: gettextCatalog.getString('The maximum expiration is 4 weeks.', null, 'Error'),
            invalid: gettextCatalog.getString('Invalid expiration time.', null, 'Error')
        };

        const dispatch = (type, message) => $rootScope.$emit('composer.update', { type, data: { message, type: 'expiration' } });
        const notifError = (message) => notify({ message, classes: 'notification-danger' });

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
                    weeks: angular.copy(_.findWhere(OPTIONS.week, { value: Math.floor(deltaDays / 7) })),
                    days: angular.copy(_.findWhere(OPTIONS.day, { value: (deltaDays % 7) })),
                    hours: angular.copy(_.findWhere(OPTIONS.hour, { value: (deltaHours % 24) }))
                };
            }

            return { days: 0, hours: 0, weeks: 0 };

        };

        const computeHours = ({ days, hours, weeks }) => hours.value + ((days.value + weeks.value * 7) * 24);

        return {
            replace: true,
            scope: {
                message: '='
            },
            templateUrl: 'templates/composer/composerExpiration.tpl.html',
            link(scope, el) {
                const $cancel = el.find('.composerExpiration-btn-cancel');
                scope.model = initModel(scope.message);
                scope.options = OPTIONS;

                const onSubmit = (e) => {

                    // We don't want to submit the whole composer
                    e.stopPropagation();

                    const hours = computeHours(scope.model);

                     // How can we enter in this situation?
                    if (parseInt(hours, 10) > CONSTANTS.MAX_EXPIRATION_TIME) {
                        return notifError(MESSAGES.maxEpiration);
                    }

                    if (isNaN(hours)) {
                        return notifError(MESSAGES.invalid);
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
    });
