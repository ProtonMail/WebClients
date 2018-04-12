import _ from 'lodash';

/* @ngInject */
function weekdayTimePicker(dateUtils, dispatchers, datetimeErrorCombiner, timepickerModel) {
    const days = dateUtils.getSortedWeekdays();

    const getWeekDay = (timestamp) => Math.floor(timestamp / (24 * 3600)) % 7;
    const getTime = (timestamp) => timestamp % (24 * 3600);

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/ui/weekdayTimePicker.tpl.html'),
        scope: {
            form: '='
        },
        compile(elem) {
            // Generate a unique eventkey for the timepicker. The directive is opaque: the user should not know about the sub timepicker.
            const timePickerKey = Math.floor(1e16 * Math.random()).toString(36);
            elem[0].querySelector('.timepicker').setAttribute('data-event-key', timePickerKey);

            return (scope, elem, { datePickerKey, timestamp, disableInput, labelId }) => {
                const { on, unsubscribe, dispatcher } = dispatchers(['timepicker']);
                const dispatchHelper = (type, data) => dispatcher.timepicker(type, data);

                // definitions
                const weekDaySelector = elem.find('.week-day-selector');

                timepickerModel.initTimePicker(timePickerKey, { disableInput, labelId: labelId + '_time' });

                scope.datePickerKey = datePickerKey;
                scope.timestamp = String(Number(timestamp)) === timestamp ? Number(timestamp) : null;
                scope.disableInput = disableInput === 'true';
                scope.labelId = labelId;

                scope.combineErrors = datetimeErrorCombiner.create(timePickerKey, scope);

                // functions
                function calcInternalVariables() {
                    if (scope.timestamp === null) {
                        scope.model.time = null;
                        scope.model.weekday = null;
                        return;
                    }

                    scope.model.weekday = _.find(scope.days, { value: getWeekDay(scope.timestamp) });
                    scope.model.time = getTime(scope.timestamp);
                }

                function onWeekDayChange() {
                    scope.$applyAsync(calcTimestamp);
                }

                function calcTimestamp() {
                    if (scope.model.time === null || scope.model.weekday === null) {
                        scope.timestamp = null;
                        dispatchHelper('update', { eventKey: scope.datePickerKey, timestamp: scope.timestamp });
                        return;
                    }
                    // combine
                    scope.timestamp = scope.model.weekday.value * 24 * 3600 + scope.model.time;
                    dispatchHelper('update', { eventKey: scope.datePickerKey, timestamp: scope.timestamp });
                }

                // initialization

                scope.model = { time: null, weekday: null };
                scope.data = { timestamp: null, zone: 'UTC' };
                // Generate a unique eventkey for the timepicker. The directive is opaque: the user should not know about the sub timepicker.
                scope.timePickerKey = scope.datePickerKey + Math.floor(1e16 * Math.random()).toString(36);
                scope.days = days;
                weekDaySelector.attr('id', scope.labelId);
                calcInternalVariables();

                on('timepicker', (event, { type, data }) => {
                    if (type === 'refresh' && data.eventKey === scope.datePickerKey) {
                        scope.timestamp = data.timestamp;
                        calcInternalVariables();
                    }

                    if (type === 'update' && data.eventKey === timePickerKey) {
                        calcTimestamp();
                    }
                });

                weekDaySelector.on('change', onWeekDayChange);

                scope.$on('$destroy', () => {
                    unsubscribe();
                    weekDaySelector.off('change', onWeekDayChange);
                });
            };
        }
    };
}
export default weekdayTimePicker;
