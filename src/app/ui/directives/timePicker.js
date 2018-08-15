import _ from 'lodash';

/* @ngInject */
function timePicker(dispatchers, timepickerModel) {
    const { dispatcher } = dispatchers(['timepicker']);
    const dispatch = (type, data) => dispatcher.timepicker(type, data);

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/ui/timePicker.tpl.html'),
        require: '?ngModel',
        scope: {},
        link(scope, elem, { eventKey }, modelCtrl) {
            const unsubscribe = [];

            const input = elem.find('input');
            unsubscribe.push(
                timepickerModel.onInitTimePicker(eventKey, (config) => {
                    input.attr('disabled', config.disableInput === 'true');
                    input.attr('id', config.labelId);
                })
            );

            scope.model = { currentTime: null };
            // This is needed!! You need to link the name of the input to the eventKey
            // The name is in the input directive scope, so it can only be passed using the scope.
            scope.eventKey = eventKey;

            const onTimePickerChange = (() => {
                let changing = false;
                return () => {
                    if (!changing) {
                        changing = true;
                        input.change();
                        changing = false;
                    }
                };
            })();

            const timepicker = input
                .timepicker({
                    change: onTimePickerChange,
                    showOnInput: true,
                    timeFormat: 'h:mm p'
                })
                .data('TimePicker');

            function onChange() {
                const time = timepicker.getTime();
                // this makes sure the input actually shows the selected time in the right format
                // when typing in something weird.
                timepicker.setTime(time);

                scope.$applyAsync(() => {
                    if (!(time instanceof Date)) {
                        modelCtrl.$setViewValue(null);
                        if (input.val() !== '') {
                            input.val('');
                            input.change();
                            return;
                        }
                    } else {
                        modelCtrl.$setViewValue(time.getHours() * 3600 + time.getMinutes() * 60);
                    }
                    dispatch('update', { eventKey, timestamp: modelCtrl.$modelValue });
                });
            }

            if (modelCtrl) {
                modelCtrl.$render = () => {
                    if (modelCtrl.$modelValue === null) {
                        scope.model.currentTime = null;
                    } else {
                        const hour = Math.floor(modelCtrl.$modelValue / 3600);
                        const minute = Math.floor((modelCtrl.$modelValue - hour * 3600) / 60);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const correctHour = hour % 12 === 0 ? 12 : hour % 12;
                        scope.model.currentTime = correctHour + ':' + (minute < 10 ? '0' : '') + minute + ' ' + ampm;
                    }
                };

                input.on('change', onChange);
                unsubscribe.push(() => input.off('change', onChange));
            }

            unsubscribe.push(() => timepicker.destroy());

            scope.$on('$destroy', () => {
                _.each(unsubscribe, (cb) => cb());
                unsubscribe.length = 0;
            });
        }
    };
}
export default timePicker;
