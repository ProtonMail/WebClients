/* @ngInject */
function autoresponder(autoresponderModel, timepickerModel, autoresponderLanguage, dispatchers, mailSettingsModel) {
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
        templateUrl: require('../../../templates/autoresponder/autoresponder.tpl.html'),
        scope: {},
        link(scope, elem, { mock }) {
            const { dispatcher, unsubscribe, on } = dispatchers(['autoresponder']);

            /*
                 When the user is a free user we need to show a disabled interface that shows what can be done
                 if you would get a paid subscription: essentially a mock-up is shown.
                 */
            scope.mock = mock === 'true';

            scope.frequencies = frequencies;

            scope.datetimepickerStartTime = 'startTimePickerKey';
            scope.datetimepickerEndTime = 'endTimePickerKey';
            scope.submitting = false;

            scope.model = {
                isEnabled: false,
                message: null,
                repeat: 0,
                subject: null,
                startTime: null,
                endTime: null,
                daysSelected: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }
            };

            const isEmpty = (message) =>
                message !== null &&
                $(message)
                    .text()
                    .trim().length === 0;

            scope.isValid = () => {
                return (
                    !scope.model.isEnabled ||
                    (!isEmpty(scope.model.message) &&
                        scope.model.message.length < autoresponderModel.constants.MAX_MESSAGE_LENGTH &&
                        (scope.model.repeat === autoresponderModel.constants.FOREVER ||
                            (scope.model.startTime !== null && scope.model.endTime !== null)))
                );
            };

            const onFormSubmit = () => {
                if (scope.mock) {
                    return;
                }
                scope.$applyAsync(() => {
                    scope.submitting = true;
                    dispatcher.autoresponder('save', { autoresponder: scope.model });
                });
            };

            scope.timezones = autoresponderModel.timezones;

            /*
                  When the user is a free user we need to show a disabled interface that shows what can be done
                  if you would get a paid subscription: essentially a mock-up is shown.
                 */
            if (scope.mock) {
                on('autoresponder', (event, { type, data = {} }) => {
                    if (type === 'update') {
                        scope.$applyAsync(() => {
                            scope.model = data.autoresponder;
                        });
                    }
                });

                autoresponderModel.mock();
            } else {
                on('autoresponder', (event, { type, data = {} }) => {
                    switch (type) {
                        case 'update':
                            scope.$applyAsync(() => {
                                scope.model = data.autoresponder;
                            });
                            break;
                        case 'saved_success':
                            scope.$applyAsync(() => {
                                scope.submitting = false;
                            });
                            break;
                        case 'saved_error': {
                            const { isEnabled } = mailSettingsModel.get('AutoResponder') || {};

                            scope.$applyAsync(() => {
                                scope.model.isEnabled = isEnabled;
                                scope.submitting = false;
                            });
                            break;
                        }
                    }
                });

                on('autoresponder.toggle', (e, { status }) => {
                    // First check that the autoresponder enabled will change.
                    if (!autoresponderModel.willUpdate(status)) {
                        return;
                    }
                    autoresponderModel.set({ isEnabled: status });
                    if (!status) {
                        onFormSubmit();
                    }
                });

                autoresponderModel.load();
            }

            const form = elem.find('form');

            form.on('submit', onFormSubmit);

            scope.$on('$destroy', () => {
                unsubscribe();
                form.off('submit', onFormSubmit);
            });
        }
    };
}
export default autoresponder;
