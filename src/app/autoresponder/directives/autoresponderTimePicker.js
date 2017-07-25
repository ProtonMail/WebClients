angular.module('proton.autoresponder')
    .directive('autoresponderTimePicker', ($rootScope, autoresponderModel, timepickerModel) => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/autoresponder/autoresponderTimePicker.tpl.html',
            scope: {
                form: '='
            },
            link(scope, elem, { datePickerKey, labelId, repeat, zone, timestamp, disableInput }) {
                const unsubscribe = [];

                scope.repeat = Number(repeat);
                // if timestamp is a number convert it into a number, otherwise it's null.
                scope.timestamp = String(Number(timestamp)) === timestamp ? Number(timestamp) : null;
                scope.disableInput = disableInput === 'true';
                scope.zone = zone;

                scope.constants = autoresponderModel.constants;
                scope.labelId = labelId;
                scope.datePickerKey = datePickerKey;

                if (repeat === autoresponderModel.constants.DAILY) {
                    timepickerModel.initTimePicker(datePickerKey, { disableInput, labelId });
                }

                unsubscribe.push($rootScope.$on('timepicker', (event, { type, data }) => {
                    if (type === 'update' && data.eventKey === datePickerKey) {
                        // save the timestamp so we don't refresh the timepicker on autoresponder.update
                        // this is important as refresh(null) can clear all fields, while a null timestamp doesn't
                        // mean they are necessarily empty. (one of the subfields can be empty)
                        scope.timestamp = data.timestamp;
                        autoresponderModel.set({ [labelId]: data.timestamp });
                    }
                }));

                unsubscribe.push($rootScope.$on('autoresponder', (event, { type, data = {} }) => {
                    if (type === 'update') {
                        const refresh = data.autoresponder.repeat !== scope.repeat || scope.timestamp !== data.autoresponder[labelId];

                        scope.repeat = data.autoresponder.repeat;
                        scope.timestamp = data.autoresponder[labelId];
                        scope.zone = data.autoresponder.zone;

                        if (data.autoresponder.repeat === autoresponderModel.constants.DAILY) {
                            timepickerModel.initTimePicker(datePickerKey, { disableInput, labelId });
                        }

                        if (refresh) {
                            timepickerModel.refresh(scope.datePickerKey, scope.timestamp, scope.zone);
                        }

                    }
                }));

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
