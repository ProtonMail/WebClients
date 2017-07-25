angular.module('proton.autoresponder')
    .directive('autoresponder', (autoresponderModel, timepickerModel, $rootScope, autoresponderLanguage) => {
        const frequencies = [
            { label: autoresponderLanguage.DURATION_FOREVER, value: autoresponderModel.constants.FOREVER },
            { label: autoresponderLanguage.DURATION_FIXED, value: autoresponderModel.constants.FIXED_INTERVAL },
            { label: autoresponderLanguage.DURATION_DAILY, value: autoresponderModel.constants.DAILY },
            { label: autoresponderLanguage.DURATION_WEEKLY, value: autoresponderModel.constants.WEEKLY },
            { label: autoresponderLanguage.DURATION_MONTHLY, value: autoresponderModel.constants.MONTHLY }
        ];

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/autoresponder/autoresponder.tpl.html',
            scope: {},
            link(scope, elem, { mock }) {
                const unsubscribe = [];

                /*
                 When the user is a free user we need to show a disabled interface that shows what can be done
                 if you would get a paid subscription: essentially a mock-up is shown.
                 */
                scope.mock = mock === 'true';

                scope.frequencies = frequencies;

                scope.datetimepickerStartTime = 'startTimePickerKey';
                scope.datetimepickerEndTime = 'endTimePickerKey';
                scope.submitting = false;

                scope.model = { isEnabled: false,
                    message: null,
                    repeat: 0,
                    subject: null,
                    startTime: null,
                    endTime: null,
                    daysSelected: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }
                };

                scope.isValid = () => {
                    return !scope.model.isEnabled || (
                        (scope.model.message === null || scope.model.message.length < autoresponderModel.constants.MAX_MESSAGE_LENGTH)
                        && (scope.model.repeat === autoresponderModel.constants.FOREVER ||
                        (scope.model.startTime !== null && scope.model.endTime !== null)));
                };

                const onFormSubmit = () => {
                    scope.$applyAsync(() => {
                        scope.submitting = true;
                        $rootScope.$emit('autoresponder', { type: 'save', data: { autoresponder: scope.model } });
                    });
                };

                scope.timezones = autoresponderModel.timezones;

                /*
                  When the user is a free user we need to show a disabled interface that shows what can be done
                  if you would get a paid subscription: essentially a mock-up is shown.
                 */
                if (scope.mock) {

                    unsubscribe.push($rootScope.$on('autoresponder', (event, { type, data = {} }) => {
                        if (type === 'update') {
                            scope.model = data.autoresponder;
                        }
                    }));

                    autoresponderModel.mock();

                } else {

                    unsubscribe.push($rootScope.$on('autoresponder', (event, { type, data = {} }) => {
                        switch (type) {
                            case 'update':
                                scope.model = data.autoresponder;
                                break;
                            case 'saved_success':
                            case 'saved_error':
                                scope.submitting = false;
                                break;
                        }
                    }));

                    unsubscribe.push($rootScope.$on('autoresponder.toggle', () => autoresponderModel.set(scope.model)));

                    const form = elem.find('form');
                    form.on('submit', onFormSubmit);
                    unsubscribe.push(() => form.off('submit', onFormSubmit));

                    autoresponderModel.load();
                }

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
