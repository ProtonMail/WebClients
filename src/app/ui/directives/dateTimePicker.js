/* @ngInject */
function dateTimePicker(dispatchers, datetimeErrorCombiner, timepickerModel, dateUtils) {
    const minDate = new Date(1970, 1, 1);


    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/ui/dateTimePicker.tpl.html'),
        scope: {
            form: '='
        },
        compile(elem) {
            // Generate a unique eventkey for the timepicker. The directive is opaque: the user should not know about the sub timepicker.
            const timePickerKey = Math.floor(1e16 * Math.random()).toString(36);
            elem[0].querySelector('.timepicker').setAttribute('data-event-key', timePickerKey);

            const format = moment.localeData().longDateFormat('L');
            const datepicker = elem[0].querySelector('.datepicker');

            datepicker.setAttribute('placeholder', dateUtils.I18N.localizedDatePlaceholder);

            return (scope, elem, { datePickerKey, timestamp, disableInput, labelId, zone }) => {
                const { on, unsubscribe, dispatcher } = dispatchers(['timepicker']);
                const dispatchHelper = (type, data) => dispatcher.timepicker(type, data);

                const datepicker = elem.find('.datepicker');

                timepickerModel.initTimePicker(timePickerKey, { disableInput, labelId: labelId + '_time' });

                scope.zone = zone;
                scope.datePickerKey = datePickerKey;
                scope.timestamp = String(Number(timestamp)) === timestamp ? Number(timestamp) : null;
                scope.disableInput = disableInput === 'true';
                scope.labelId = labelId;

                scope.combineErrors = datetimeErrorCombiner.create(timePickerKey, scope);

                // functions
                function calcInternalVariables() {
                    if (scope.timestamp === null) {
                        scope.model.time = null;
                        scope.model.date = null;
                        return;
                    }

                    const mmnt = moment(scope.timestamp * 1000).tz(scope.zone);
                    const midnight = mmnt.clone().startOf('day');
                    scope.model.time = mmnt.diff(midnight, 'seconds');
                    // Drop the time zone and set the date and hours in the current time zone
                    scope.model.date = new Date(midnight.format('YYYY-MM-DDTHH:mm:ss'));
                }

                function onDateChange() {
                    scope.$applyAsync(() => {
                        if (datepicker.val().trim() === '') {
                            scope.model.date = null;
                            if (scope.model.pikaday.getDate() !== null) {
                                scope.model.pikaday.setDate(null);
                            }
                        }

                        if (scope.model.date instanceof Date && datepicker.val() !== moment(scope.model.date).format(format)) {
                            datepicker.val(moment(scope.model.date).format(format));
                        }
                        calcTimestamp();
                    });
                }

                function calcTimestamp() {
                    if (
                        scope.model.time === null ||
                        typeof scope.model.time === 'undefined' ||
                        scope.model.date === null ||
                        typeof scope.model.date === 'undefined'
                    ) {
                        scope.timestamp = null;
                        dispatchHelper('update', { eventKey: scope.datePickerKey, timestamp: scope.timestamp });
                        return;
                    }

                    // Format the selected date in the hours -> load the hours together with the stamp and convert that
                    // to an unix timestamp.
                    scope.timestamp = Number(moment.tz(moment(scope.model.date).format('YYYY-MM-DD'), scope.zone).format('X')) + scope.model.time;
                    dispatchHelper('update', { eventKey: scope.datePickerKey, timestamp: scope.timestamp });
                }

                // initialization
                // disable the first month of january
                scope.minDate = minDate;

                scope.model = { time: null, date: null };
                datepicker.attr('id', scope.labelId);

                calcInternalVariables();

                datepicker.on('change', onDateChange);

                on('timepicker', (event, { type, data }) => {
                    if (type === 'refresh' && data.eventKey === scope.datePickerKey) {
                        scope.timestamp = data.timestamp;
                        scope.zone = data.zone;
                        calcInternalVariables();
                    }

                    if (type === 'update' && data.eventKey === timePickerKey) {
                        calcTimestamp();
                    }
                });

                scope.$on('$destroy', () => {
                    unsubscribe();
                    datepicker.off('change', onDateChange);
                });
            };
        }
    };
}
export default dateTimePicker;
